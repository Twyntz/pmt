import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const STORAGE_KEY = 'pmt_user';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);

    // Reset localStorage between tests
    localStorage.clear();
    spyOn(localStorage, 'getItem').and.callThrough();
    spyOn(localStorage, 'setItem').and.callThrough();
    spyOn(localStorage, 'removeItem').and.callThrough();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  // ---------- Session ----------
  it('logout() should remove session from localStorage', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: '1' }));
    service.logout();
    expect(localStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
    expect(service.isLoggedIn()).toBeFalse();
  });

  it('isLoggedIn() should reflect presence of session', () => {
    expect(service.isLoggedIn()).toBeFalse();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: '1' }));
    expect(service.isLoggedIn()).toBeTrue();
  });

  it('getCurrentUser() should parse JSON and return null on invalid JSON', () => {
    expect(service.getCurrentUser()).toBeNull();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: '42', email: 'a@b.c' }));
    expect(service.getCurrentUser()).toEqual(jasmine.objectContaining({ id: '42' }));

    // invalid JSON
    (localStorage.getItem as jasmine.Spy).and.returnValue('{"oops":'); // simulate bad JSON
    expect(service.getCurrentUser()).toBeNull();
  });

  // ---------- login ----------
  it('login() should short-circuit when email or password is empty and not call HTTP', (done) => {
    service.login('', 'x').subscribe((val) => {
      expect(val).toBeNull();
      done();
    });
    httpMock.expectNone('/users');
  });

  it('login() should set session on success when user is found', (done) => {
    const email = 'alice@example.com';
    const password = 'secret';
    const hal = {
      _embedded: {
        users: [
          {
            email,
            password,
            username: 'alice',
            _links: { self: { href: 'http://backend:8080/users/123' } },
          },
        ],
      },
    };

    service.login(email, password).subscribe((session) => {
      expect(session).toEqual(
        jasmine.objectContaining({ id: '123', email, username: 'alice', role: 'USER' })
      );
      expect(localStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        jasmine.stringMatching(/"id":"123"/)
      );
      done();
    });

    const req = httpMock.expectOne('/users');
    expect(req.request.method).toBe('GET');
    req.flush(hal);
  });

  it('login() should return null when user not found', (done) => {
    const hal = { _embedded: { users: [{ email: 'bob@x.y', password: 'pwd' }] } };

    service.login('alice@example.com', 'secret').subscribe((session) => {
      expect(session).toBeNull();
      expect(localStorage.setItem).not.toHaveBeenCalled();
      done();
    });

    const req = httpMock.expectOne('/users');
    expect(req.request.method).toBe('GET');
    req.flush(hal);
  });

  // ---------- register ----------
  it('register() path #1: uses response body when present (with _links.self.href) and sets session', (done) => {
    const payload = { username: 'alice', email: 'alice@example.com', password: 'pwd' };
    const createdBody = {
      username: 'alice',
      email: 'alice@example.com',
      _links: { self: { href: 'http://backend:8080/users/555' } },
    };

    service.register(payload).subscribe((user) => {
      expect(user).toEqual(createdBody);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        jasmine.stringMatching(/"id":"555"/)
      );
      done();
    });

    const post = httpMock.expectOne('/users');
    expect(post.request.method).toBe('POST');
    post.flush(createdBody, { status: 201, statusText: 'Created' });
    // no additional requests expected in this path
  });

  it('register() path #2: follows Location header (absolute URL normalized to path) then sets session', (done) => {
    const payload = { username: 'bob', email: 'bob@example.com', password: 'pwd' };
    const location = 'http://backend:8080/users/777';
    const bodyFromGet = {
      username: 'bob',
      email: 'bob@example.com',
      _links: { self: { href: location } },
    };

    service.register(payload).subscribe((user) => {
      expect(user).toEqual(bodyFromGet);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        jasmine.stringMatching(/"id":"777"/)
      );
      done();
    });

    const post = httpMock.expectOne('/users');
    expect(post.request.method).toBe('POST');
    post.flush(null, {
      status: 201,
      statusText: 'Created',
      headers: { Location: location },
    });

    // service must GET the normalized path
    const get = httpMock.expectOne('/users/777');
    expect(get.request.method).toBe('GET');
    get.flush(bodyFromGet);
  });

  it('register() path #3: no body and no Location -> fallback GET /users and find by email, then sets session', (done) => {
    const payload = { username: 'carol', email: 'carol@example.com', password: 'pwd' };
    const hal = {
      _embedded: {
        users: [
          {
            username: 'carol',
            email: 'carol@example.com',
            _links: { self: { href: 'http://backend:8080/users/999' } },
          },
        ],
      },
    };

    service.register(payload).subscribe((user) => {
      expect(user).toEqual(jasmine.objectContaining({ email: 'carol@example.com' }));
      expect(localStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        jasmine.stringMatching(/"id":"999"/)
      );
      done();
    });

    const post = httpMock.expectOne('/users');
    expect(post.request.method).toBe('POST');
    post.flush(null, { status: 201, statusText: 'Created' });

    const list = httpMock.expectOne('/users');
    expect(list.request.method).toBe('GET');
    list.flush(hal);
  });

  it('register() should propagate HTTP error from POST and not set session', (done) => {
    const payload = { username: 'eve', email: 'eve@example.com', password: 'pwd' };

    service.register(payload).subscribe({
      next: () => fail('expected error'),
      error: (err) => {
        expect(err.status).toBe(500);
        expect(localStorage.setItem).not.toHaveBeenCalled();
        done();
      },
    });

    const post = httpMock.expectOne('/users');
    expect(post.request.method).toBe('POST');
    post.flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });
  });
});
