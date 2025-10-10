import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import { AuthService } from './services/auth.service';

class MockAuthService {
  logout = jasmine.createSpy('logout');
}

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent, RouterTestingModule],
      providers: [{ provide: AuthService, useClass: MockAuthService }],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the header component', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    // Le HeaderComponent doit être présent via son sélector (ex: <app-header>)
    expect(compiled.querySelector('app-header')).toBeTruthy();
  });

  it('should logout and navigate to /login', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const router = TestBed.inject(Router);
    const auth = TestBed.inject(AuthService) as unknown as MockAuthService;
    const navigateSpy = spyOn(router, 'navigateByUrl');

    // Act
    fixture.componentInstance.logout();

    // Assert
    expect(auth.logout).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith('/login');
  });
});
