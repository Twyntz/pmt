import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { ProjectService } from '../../../services/project.service';
@Component({
  selector: 'app-project-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule],
  templateUrl: './project-create.component.html',
  styleUrl: './project-create.component.scss'
})
export class ProjectCreateComponent implements OnInit {
  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    startDate: [''] // yyyy-MM-dd (optionnelle)
  });

  loading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private projects: ProjectService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.auth.isLoggedIn()) this.router.navigateByUrl('/login');
  }

  submit(): void {
    console.log('[ProjectCreate] submit() called, form value =', this.form.value);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error = 'Veuillez corriger le formulaire.';
      return;
    }

    const user = this.auth.getCurrentUser();
    if (!user?.id) {
      this.error = 'Session invalide : identifiant utilisateur manquant.';
      return;
    }

    const payload = {
      name: this.form.controls.name.value ?? '',
      description: this.form.controls.description.value ?? '',
      startDate: this.form.controls.startDate.value ?? '',  // <-- pas de typo !
      ownerId: user.id as string
    };

    this.loading = true;
    this.error = null;

    console.log('[ProjectCreate] POST payload →', payload);

    this.projects.create(payload).subscribe({
      next: (res) => {
        console.log('[ProjectCreate] success →', res);
        this.loading = false;
        this.router.navigateByUrl('/projects');
      },
      error: (e) => {
        this.loading = false;
        console.error('[ProjectCreate] error →', e);
        const msg = e?.error?.error || e?.error?.details || e?.message || 'Erreur inconnue';
        this.error = 'Impossible de créer le projet : ' + msg;
      }
    });
  }

  get name() { return this.form.controls.name; }
}
