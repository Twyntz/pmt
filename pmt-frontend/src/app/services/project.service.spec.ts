import { TestBed } from '@angular/core/testing';
import {HttpClientTestingModule, HttpTestingController,} from '@angular/common/http/testing';
import { ProjectService } from './project.service';

describe('ProjectService', () => {
  let service: ProjectService;
  let http: HttpTestingController;

  // Doit refléter l’ordre défini dans le service
  const PROJECT_ROOTS = [
    '/api/projects',
    'http://localhost:8080/api/projects',
    'http://localhost:8080/projects',
    'http://localhost:8080/api/v1/projects',
  ];

  const USER_ROOTS = [
    '/api/users',
    'http://localhost:8080/api/users',
    'http://localhost:8080/users',
    'http://localhost:8080/api/v1/users',
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProjectService],
    });
    service = TestBed.inject(ProjectService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  // ---------------- getAll ----------------

  it('getAll(): success on first root', (done) => {
    const data = [{ id: 'p1' }, { id: 'p2' }];

    service.getAll().subscribe((res) => {
      expect(res).toEqual(data);
      done();
    });

    const req = http.expectOne(PROJECT_ROOTS[0]);
    expect(req.request.method).toBe('GET');
    req.flush(data);
  });

  it('getAll(): fallback when first root fails then second succeeds', (done) => {
    const data = [{ id: 'pX' }];

    service.getAll().subscribe((res) => {
      expect(res).toEqual(data);
      done();
    });

    // 1er essai -> erreur
    const r1 = http.expectOne(PROJECT_ROOTS[0]);
    r1.flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });

    // 2e essai -> OK
    const r2 = http.expectOne(PROJECT_ROOTS[1]);
    expect(r2.request.method).toBe('GET');
    r2.flush(data);
  });

  it('getAll(): returns [] if all roots fail', (done) => {
    service.getAll().subscribe((res) => {
      expect(res).toEqual([]);
      done();
    });

    PROJECT_ROOTS.forEach((root) => {
      const r = http.expectOne(root);
      r.flush({ msg: 'fail' }, { status: 500, statusText: 'err' });
    });
  });

  // ---------------- getById ----------------

  it('getById(): success after 3rd fallback', (done) => {
    const id = '123';
    const expected = { id: '123', name: 'Alpha' };

    service.getById(id).subscribe((res) => {
      expect(res).toEqual(expected);
      done();
    });

    // échoue 2 fois, réussit à la 3e
    const r1 = http.expectOne(`${PROJECT_ROOTS[0]}/${id}`);
    r1.flush({}, { status: 500, statusText: 'err' });

    const r2 = http.expectOne(`${PROJECT_ROOTS[1]}/${id}`);
    r2.flush({}, { status: 404, statusText: 'notfound' });

    const r3 = http.expectOne(`${PROJECT_ROOTS[2]}/${id}`);
    r3.flush(expected, { status: 200, statusText: 'ok' });
  });

  it('getById(): returns null if all roots fail', (done) => {
    const id = 'nope';

    service.getById(id).subscribe((res) => {
      expect(res).toBeNull();
      done();
    });

    PROJECT_ROOTS.forEach((root) => {
      const r = http.expectOne(`${root}/${id}`);
      r.flush({}, { status: 500, statusText: 'err' });
    });
  });

  // ---------------- create ----------------

  it('create(): posts to first root (success)', (done) => {
    const payload = { name: 'New P' };
    const created = { id: 'p9', name: 'New P' };

    service.create(payload).subscribe((res) => {
      expect(res).toEqual(created);
      done();
    });

    const r = http.expectOne(PROJECT_ROOTS[0]);
    expect(r.request.method).toBe('POST');
    expect(r.request.body).toEqual(payload);
    r.flush(created, { status: 201, statusText: 'created' });
  });

  it('create(): falls back across roots; returns null if all fail', (done) => {
    const payload = { name: 'X' };

    service.create(payload).subscribe((res) => {
      expect(res).toBeNull();
      done();
    });

    PROJECT_ROOTS.forEach((root) => {
      const r = http.expectOne(root);
      expect(r.request.method).toBe('POST');
      r.flush({}, { status: 500, statusText: 'err' });
    });
  });

  // ---------------- getMembers ----------------

  it('getMembers(): success on second path after first fails', (done) => {
    const projectId = '42';
    const members = [{ id: 'u1' }, { id: 'u2' }];

    service.getMembers(projectId).subscribe((res) => {
      expect(res).toEqual(members);
      done();
    });

    const path1 = `${PROJECT_ROOTS[0]}/${projectId}/members`;
    const path2 = `${PROJECT_ROOTS[1]}/${projectId}/members`;

    const r1 = http.expectOne(path1);
    r1.flush({}, { status: 500, statusText: 'err' });

    const r2 = http.expectOne(path2);
    expect(r2.request.method).toBe('GET');
    r2.flush(members);
  });

  it('getMembers(): returns [] if all paths fail', (done) => {
    const projectId = '77';

    service.getMembers(projectId).subscribe((res) => {
      expect(res).toEqual([]);
      done();
    });

    PROJECT_ROOTS.forEach((root) => {
      const r = http.expectOne(`${root}/${projectId}/members`);
      r.flush({}, { status: 500, statusText: 'err' });
    });
  });

  // ---------------- inviteMember ----------------

  it('inviteMember(): posts body and succeeds after a fallback', (done) => {
    const projectId = '11';
    const email = 'person@example.com';
    const role = 'READER';
    const body = { email, role };
    const ok = { invited: true };

    service.inviteMember(projectId, email, role).subscribe((res) => {
      expect(res).toEqual(ok);
      done();
    });

    const p1 = `${PROJECT_ROOTS[0]}/${projectId}/invite`;
    const p2 = `${PROJECT_ROOTS[1]}/${projectId}/invite`;

    const r1 = http.expectOne(p1);
    expect(r1.request.method).toBe('POST');
    expect(r1.request.body).toEqual(body);
    r1.flush({}, { status: 500, statusText: 'err' });

    const r2 = http.expectOne(p2);
    expect(r2.request.method).toBe('POST');
    expect(r2.request.body).toEqual(body);
    r2.flush(ok, { status: 200, statusText: 'ok' });
  });

  it('inviteMember(): returns null if all paths fail', (done) => {
    const projectId = '12';

    service.inviteMember(projectId, 'a@b.c', 'WRITER').subscribe((res) => {
      expect(res).toBeNull();
      done();
    });

    PROJECT_ROOTS.forEach((root) => {
      const r = http.expectOne(`${root}/${projectId}/invite`);
      r.flush({}, { status: 500, statusText: 'err' });
    });
  });

  // ---------------- getUserById ----------------

  it('getUserById(): success on first root', (done) => {
    const userId = 'u-1';
    const user = { id: userId, username: 'alice' };

    service.getUserById(userId).subscribe((res) => {
      expect(res).toEqual(user);
      done();
    });

    const r = http.expectOne(`${USER_ROOTS[0]}/${userId}`);
    expect(r.request.method).toBe('GET');
    r.flush(user);
  });

  it('getUserById(): returns null if all roots fail', (done) => {
    const userId = 'ghost';

    service.getUserById(userId).subscribe((res) => {
      expect(res).toBeNull();
      done();
    });

    USER_ROOTS.forEach((root) => {
      const r = http.expectOne(`${root}/${userId}`);
      r.flush({}, { status: 500, statusText: 'err' });
    });
  });
});
