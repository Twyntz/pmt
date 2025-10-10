import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from '../services/auth.service';
import { authGuard } from './auth.guard';

class MockAuthService {
  isLoggedIn = jasmine.createSpy('isLoggedIn');
}

describe('authGuard (CanActivateFn)', () => {
  let router: Router;
  let auth: MockAuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule.withRoutes([])],
      providers: [{ provide: AuthService, useClass: MockAuthService }],
    }).compileComponents();

    router = TestBed.inject(Router);
    auth = TestBed.inject(AuthService) as unknown as MockAuthService;
  });

  function runGuard() {
    // Le guard est un CanActivateFn, on l’exécute dans le contexte d’injection du TestBed
    return TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
  }

  it('should allow navigation when user is logged in', () => {
    const navSpy = spyOn(router, 'navigateByUrl');
    auth.isLoggedIn.and.returnValue(true);

    const result = runGuard();

    expect(result).toBeTrue();
    expect(auth.isLoggedIn).toHaveBeenCalled();
    expect(navSpy).not.toHaveBeenCalled();
  });

  it('should block navigation and redirect to /login when user is not logged in', () => {
    const navSpy = spyOn(router, 'navigateByUrl');
    auth.isLoggedIn.and.returnValue(false);

    const result = runGuard();

    expect(result).toBeFalse();
    expect(auth.isLoggedIn).toHaveBeenCalled();
    expect(navSpy).toHaveBeenCalledWith('/login');
  });
});
