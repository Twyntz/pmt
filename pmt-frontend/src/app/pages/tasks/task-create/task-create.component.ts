import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { TaskService, TaskPayload } from '../../../services/task.service';
import { ProjectService } from '../../../services/project.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-task-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule],
  templateUrl: './task-create.component.html'
})
export class TaskCreateComponent implements OnInit {
  projectId = '';
  members: Array<{ email: string; username?: string }> = [];
  submitting = false;
  serverError: string | null = null;

  form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    status: ['IN_PROGRESS'],
    priority: ['MEDIUM'],
    deadline: [''],
    endDate: [''],
    assigneeEmail: ['']
  });

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private tasks: TaskService,
    private projects: ProjectService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('id') || '';
    // --- Contrôle d'accès : OWNER/ADMIN/MEMBER uniquement ---
    this.projects.getMembers(this.projectId).subscribe({
      next: (list) => {
        const members = Array.isArray(list) ? list : [];
        const current = this.auth.getCurrentUser();
        const isOwner = false; // pas nécessaire ici; on s'appuie sur les membres
        const me = members.find(m =>
          m?.id === current?.id || m?.userId === current?.id || m?.email === current?.email
        );
        const allowed = !!me && (me.role === 'ADMIN' || me.role === 'MEMBER');
        if (!allowed) {
          // Redirection si accès interdit
          this.router.navigate(['/projects', this.projectId]);
          return;
        }
        // Charger la liste pour le select
        this.members = members.map((m: any) => ({ email: m.email || '', username: m.username || '' }))
                              .filter(m => !!m.email);
      },
      error: () => {
        // En cas d'erreur membres, prudence => on renvoie vers la page projet
        this.router.navigate(['/projects', this.projectId]);
      }
    });
  }

  private toYYYYMMDD(d?: string | null): string | undefined {
    if (!d) return undefined;
    const parts = d.split('-');
    return parts.length === 3 ? `${parts[0]}-${parts[1]}-${parts[2]}` : undefined;
  }

  submit(): void {
    this.serverError = null;
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const current = this.auth.getCurrentUser();
    const currentUserId = current?.id || undefined;

    const v = this.form.value;
    const payload: TaskPayload = {
      title: v.title || '',
      description: v.description || undefined,
      status: (v.status as any) || 'IN_PROGRESS',
      priority: (v.priority as any) || 'MEDIUM',
      deadline: this.toYYYYMMDD(v.deadline || undefined),
      endDate: this.toYYYYMMDD(v.endDate || undefined),
      assigneeId: null,
      assigneeEmail: v.assigneeEmail ? String(v.assigneeEmail) : null,
      changedBy: currentUserId ? String(currentUserId) : null
    };

    this.submitting = true;
    this.tasks.create(this.projectId, payload).subscribe({
      next: (t) => {
        this.submitting = false;
        this.router.navigate(['/projects', this.projectId, 'tasks', t?.id]);
      },
      error: (e) => {
        this.submitting = false;
        const msg = e?.error?.details || e?.error?.error || e?.message || 'Erreur inconnue';
        this.serverError = msg;
      }
    });
  }
}
