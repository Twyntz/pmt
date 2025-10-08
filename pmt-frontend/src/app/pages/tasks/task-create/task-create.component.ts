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
    assigneeEmail: ['']   // on enverra l'email (ou vide)
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
    this.loadMembers();
  }

  private loadMembers(): void {
    this.projects.getMembers(this.projectId).subscribe({
      next: (list) => {
        this.members = (Array.isArray(list) ? list : [])
          .map((m: any) => ({ email: m.email || '', username: m.username || '' }))
          .filter(m => !!m.email);
      },
      error: () => { this.members = []; }
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
      assigneeId: null,                             // on n’utilise pas l’UUID ici
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
