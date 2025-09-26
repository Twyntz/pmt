import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  // ⬇️ noms attendus par ton template
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  errorMessage: string | null = null;
  loading = false;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  // ⬇️ méthode attendue par ton template
  onSubmit(): void {
    if (this.loginForm.invalid) return;

    const { email, password } = this.loginForm.value as any;
    this.loading = true;
    this.errorMessage = null;

    this.auth.login(email, password).subscribe({
      next: (session) => {
        this.loading = false;
        if (!session) {
          this.errorMessage = 'Identifiants invalides.';
          return;
        }
        this.router.navigateByUrl('/dashboard');
      },
      error: (e) => {
        console.error(e);
        this.loading = false;
        this.errorMessage = 'Erreur de connexion. Vérifie l’API http://localhost:8080/users';
      }
    });
  }
}
