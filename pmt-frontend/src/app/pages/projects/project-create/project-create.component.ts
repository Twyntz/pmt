import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

import { ProjectService, CreateProjectPayload } from '../../../services/project.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-project-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule],
  templateUrl: './project-create.component.html',
  styleUrl: './project-create.component.scss'
})
export class ProjectCreateComponent implements OnInit {
  loading = false;
  error: string | null = null;

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    startDate: [''] // YYYY-MM-DD
  });

  constructor(
    private fb: FormBuilder,
    private projects: ProjectService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigateByUrl('/login');
      return;
    }
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true; this.error = null;

    const current = this.auth.getCurrentUser();
    const payload: CreateProjectPayload = {
      name: this.form.controls.name.value ?? '',
      description: this.form.controls.description.value ?? '',
      startDate: this.form.controls.startDate.value ?? '',
      ownerId: current?.id // optionnel si le back l'infère
    };

    this.projects.create(payload).subscribe({
      next: (res: any) => {
        this.loading = false;
        const newId: string | undefined = res?.id || res?.projectId || res?.data?.id;
        this.router.navigateByUrl(newId ? `/projects/${newId}` : '/projects');
      },
      error: (e: unknown) => {
        this.loading = false;
        const err = e as any;
        const msg = err?.error?.error || err?.error?.details || err?.message || 'Erreur inconnue';
        this.error = 'Impossible de créer le projet : ' + msg;
      }
    });
  }

  // Getters pour le template (on expose les deux pour compatibilité)
  get nameCtrl() { return this.form.controls.name; }
  get name() { return this.form.controls.name; }
}
