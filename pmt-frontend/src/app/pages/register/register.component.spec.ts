import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../services/auth.service';
import { ReactiveFormsModule } from '@angular/forms';

class MockAuthService {
  register = jasmine.createSpy('register');
}

describe('RegisterComponent', () => {
  let router: Router;
  let auth: MockAuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterComponent, RouterTestingModule, ReactiveFormsModule],
      providers: [{ provide: AuthService, useClass: MockAuthService }],
    }).compileComponents();

    router = TestBed.inject(Router);
    auth = TestBed.inject(AuthService) as unknown as MockAuthService;
  });

  function create() {
    const fixture = TestBed.createComponent(RegisterComponent);
    const comp = fixture.componentInstance;
    fixture.detectChanges();
    return { fixture, comp };
  }

  it('should create', () => {
    const { comp } = create();
    expect(comp).toBeTruthy();
  });

  it('form invalid initially; submit() must not call auth.register', () => {
    const { comp } = create();

    expect(comp.form.invalid).toBeTrue();
    comp.submit();

    expect(auth.register).not.toHaveBeenCalled();
    expect(comp.loading).toBeFalse();
  });

  it('validator passwordsMatch: mismatch when different, valid when equal', () => {
    const { comp } = create();

    comp.form.setValue({
      username: 'al',
      email: 'bad', // volontairement invalide, on ne soumet pas ici
      groupPwd: { password: 'abcdef', confirm: 'ABCDEF' },
    });

    // Le groupe doit avoir l’erreur mismatch
    expect(comp.groupPwd.errors?.['mismatch']).toBeTrue();

    // Corrige la confirmation
    comp.groupPwd.get('confirm')?.setValue('abcdef');
    comp.groupPwd.updateValueAndValidity();

    expect(comp.groupPwd.errors).toBeNull();
  });

  it('submit() success: navigates to /login?registered=1 and clears error', () => {
    const { comp } = create();
    const navSpy = spyOn(router, 'navigate');

    comp.form.setValue({
      username: 'alice',
      email: 'alice@example.com',
      groupPwd: { password: 'abcdef', confirm: 'abcdef' },
    });
    expect(comp.form.valid).toBeTrue();

    auth.register.and.returnValue(of({ id: 'u1' }));

    comp.submit();

    expect(comp.loading).toBeFalse();
    expect(comp.error).toBeNull();
    expect(auth.register).toHaveBeenCalledWith({
      username: 'alice',
      email: 'alice@example.com',
      password: 'abcdef',
    });
    expect(navSpy).toHaveBeenCalledWith(['/login'], { queryParams: { registered: 1 } });
  });

  it('submit() HTTP error: sets error message and resets loading', () => {
    const { comp } = create();
    spyOn(console, 'error');

    comp.form.setValue({
      username: 'bob',
      email: 'bob@example.com',
      groupPwd: { password: 'abcdef', confirm: 'abcdef' },
    });
    expect(comp.form.valid).toBeTrue();

    auth.register.and.returnValue(throwError(() => ({ status: 500 })));

    comp.submit();

    expect(comp.loading).toBeFalse();
    expect(comp.error).toBe("Impossible de créer le compte. Vérifie l'API /users.");
    expect(auth.register).toHaveBeenCalled();
  });

  it('username minLength and email format: form should be invalid when constraints not met', () => {
    const { comp } = create();

    comp.form.setValue({
      username: 'ab', // < 3
      email: 'not-an-email',
      groupPwd: { password: 'abcdef', confirm: 'abcdef' },
    });

    expect(comp.username.hasError('minlength')).toBeTrue();
    expect(comp.email.hasError('email')).toBeTrue();
    expect(comp.form.invalid).toBeTrue();
  });
});
