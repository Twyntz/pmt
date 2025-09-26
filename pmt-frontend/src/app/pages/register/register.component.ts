import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

function passwordsMatch(ctrl: AbstractControl): ValidationErrors | null {
  const pwd = ctrl.get('password')?.value;
  const confirm = ctrl.get('confirm')?.value;
  return pwd && confirm && pwd !== confirm ? { mismatch: true } : null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  form = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    groupPwd: this.fb.group(
      {
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirm: ['', [Validators.required]]
      },
      { validators: [passwordsMatch] }
    )
  });

  loading = false;
  error: string | null = null;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  submit(): void {
    if (this.form.invalid) return;

    const username = this.form.controls.username.value ?? '';
    const email = this.form.controls.email.value ?? '';
    // ⬇️ coercition en string pour satisfaire le type
    const password = (this.form.controls.groupPwd.get('password')?.value ?? '') as string;

    this.loading = true;
    this.error = null;

    this.auth.register({ username, email, password }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/login'], { queryParams: { registered: 1 } });
      },
      error: (e) => {
        this.loading = false;
        console.error(e);
        this.error = "Impossible de créer le compte. Vérifie l'API /users.";
      }
    });
  }

  // getters pratiques
  get username() { return this.form.controls.username; }
  get email() { return this.form.controls.email; }
  get groupPwd() { return this.form.controls.groupPwd; }
  get passwordCtrl() { return this.form.controls.groupPwd.get('password'); }
  get confirmCtrl() { return this.form.controls.groupPwd.get('confirm'); }
}
