import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';
import { ReactiveFormsModule } from '@angular/forms';

class MockAuthService {
  login = jasmine.createSpy('login');
}

describe('LoginComponent', () => {
  let router: Router;
  let auth: MockAuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent, RouterTestingModule, ReactiveFormsModule],
      providers: [{ provide: AuthService, useClass: MockAuthService }],
    }).compileComponents();

    router = TestBed.inject(Router);
    auth = TestBed.inject(AuthService) as unknown as MockAuthService;
  });

  function create() {
    const fixture = TestBed.createComponent(LoginComponent);
    const comp = fixture.componentInstance;
    fixture.detectChanges();
    return { fixture, comp };
  }

  it('should create', () => {
    const { comp } = create();
    expect(comp).toBeTruthy();
  });

  it('onSubmit() with invalid form: should not call auth.login', () => {
    const { comp } = create();
    // Formulaire vide -> invalide
    expect(comp.loginForm.invalid).toBeTrue();

    comp.onSubmit();

    expect(auth.login).not.toHaveBeenCalled();
    // loading ne doit pas passer à true
    expect(comp.loading).toBeFalse();
  });

  it('onSubmit() success: should navigate to /dashboard and clear errorMessage', () => {
    const { comp } = create();
    const navigateSpy = spyOn(router, 'navigateByUrl');

    comp.loginForm.setValue({ email: 'alice@example.com', password: 'secret' });
    expect(comp.loginForm.valid).toBeTrue();

    // Simule un succès: session truthy
    const session = { id: '123', email: 'alice@example.com' };
    auth.login.and.returnValue(of(session));

    comp.onSubmit();

    expect(comp.loading).toBeFalse();
    expect(comp.errorMessage).toBeNull();
    expect(auth.login).toHaveBeenCalledWith('alice@example.com', 'secret');
    expect(navigateSpy).toHaveBeenCalledWith('/dashboard');
  });

  it('onSubmit() functional failure: null session -> sets "Identifiants invalides."', () => {
    const { comp } = create();

    comp.loginForm.setValue({ email: 'bob@example.com', password: 'wrong' });
    auth.login.and.returnValue(of(null));

    comp.onSubmit();

    expect(comp.loading).toBeFalse();
    expect(comp.errorMessage).toBe('Identifiants invalides.');
  });

  it('onSubmit() HTTP error: sets API error message and resets loading', () => {
    const { comp } = create();

    comp.loginForm.setValue({ email: 'carol@example.com', password: 'pwd' });
    auth.login.and.returnValue(throwError(() => ({ status: 500 })));

    // Évite le bruit console.error dans le test
    spyOn(console, 'error');

    comp.onSubmit();

    expect(comp.loading).toBeFalse();
    expect(comp.errorMessage).toContain('Erreur de connexion');
    // S’assure qu’on a bien essayé d’appeler l’auth
    expect(auth.login).toHaveBeenCalled();
  });
});
