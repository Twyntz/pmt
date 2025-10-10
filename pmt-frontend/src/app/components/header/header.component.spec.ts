import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { HeaderComponent } from './header.component';
import { AuthService } from '../../services/auth.service';

class MockAuthService {
  logout = jasmine.createSpy('logout');
}

describe('HeaderComponent', () => {
  let router: Router;
  let auth: MockAuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent, RouterTestingModule],
      providers: [{ provide: AuthService, useClass: MockAuthService }],
    }).compileComponents();

    router = TestBed.inject(Router);
    auth = TestBed.inject(AuthService) as unknown as MockAuthService;
  });

  function create() {
    const fixture = TestBed.createComponent(HeaderComponent);
    const comp = fixture.componentInstance;
    fixture.detectChanges();
    return { fixture, comp };
  }

  it('should create', () => {
    const { comp } = create();
    expect(comp).toBeTruthy();
  });

  it('logout(): should call AuthService.logout and navigate to /login', () => {
    const { comp } = create();
    const navSpy = spyOn(router, 'navigateByUrl');

    comp.logout();

    expect(auth.logout).toHaveBeenCalled();
    expect(navSpy).toHaveBeenCalledWith('/login');
  });
});
