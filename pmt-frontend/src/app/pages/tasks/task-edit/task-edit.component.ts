import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { TaskService } from '../../../services/task.service';
import { ProjectService } from '../../../services/project.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-task-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule],
  templateUrl: './task-edit.component.html'
})
export class TaskEditComponent implements OnInit {
  projectId = '';
  taskId = '';
  members: Array<{ email: string; username?: string }> = [];
  submitting = false;
  serverError: string | null = null;

  assigneeChanged = false;

  form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    status: ['IN_PROGRESS'],
    priority: ['MEDIUM'],
    deadline: [''],
    endDate: [''],
    assigneeEmail: [''] // email ou '' pour désassigner
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
    this.taskId = this.route.snapshot.paramMap.get('taskId') || '';
    this.loadMembers();
    this.loadTask();
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

  private toInputDate(d?: string | null): string {
    if (!d) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    const dt = new Date(d);
    if (isNaN(+dt)) return '';
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private loadTask(): void {
    this.tasks.get(this.projectId, this.taskId).subscribe({
      next: (t) => {
        this.form.reset({
          title: t?.title || '',
          description: t?.description || '',
          status: t?.status || 'IN_PROGRESS',
          priority: t?.priority || 'MEDIUM',
          deadline: this.toInputDate(t?.deadline),
          endDate: this.toInputDate(t?.endDate),
          assigneeEmail: t?.assigneeEmail || ''
        }, { emitEvent: false });
        this.assigneeChanged = false;
      },
      error: (e) => {
        this.serverError = e?.error?.error || e?.message || 'Erreur chargement';
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

    // On n’envoie l’assignation que si l’utilisateur a modifié le champ.
    const assignPart = this.assigneeChanged
      ? { assigneeEmail: v.assigneeEmail ? String(v.assigneeEmail) : '' } // '' => désassigner
      : {};

    const payload = {
      title: v.title || undefined,
      description: v.description ?? undefined,
      status: (v.status as any) || undefined,
      priority: (v.priority as any) || undefined,
      deadline: this.toYYYYMMDD(v.deadline || undefined),
      endDate: this.toYYYYMMDD(v.endDate || undefined),
      changedBy: currentUserId ? String(currentUserId) : null,
      ...assignPart
    };

    this.submitting = true;
    this.tasks.update(this.projectId, this.taskId, payload).subscribe({
      next: () => {
        this.submitting = false;
        this.router.navigate(['/projects', this.projectId, 'tasks', this.taskId]);
      },
      error: (e) => {
        this.submitting = false;
        const msg = e?.error?.details || e?.error?.error || e?.message || 'Erreur inconnue';
        this.serverError = msg;
      }
    });
  }
}
