import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { TaskPriority, TaskService, TaskStatus } from '../../../services/task.service';
import { AuthService } from '../../../services/auth.service';
import { ProjectService } from '../../../services/project.service';
@Component({
  selector: 'app-task-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule],
  templateUrl: './task-edit.component.html',
  styleUrl: './task-edit.component.scss'
})
export class TaskEditComponent implements OnInit {
  projectId = '';
  taskId = '';

  loading = false;
  loadingTask = false;
  error: string | null = null;
  loadError: string | null = null;

  // membres pour l'assignation
  members: Array<{ id: string; username: string; email: string }> = [];
  loadingMembers = false;
  loadMembersError: string | null = null;

  form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    status: ['TODO' as TaskStatus],
    priority: ['MEDIUM' as TaskPriority],
    deadline: [''],
    endDate: [''],
    assigneeId: ['']
  });

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private tasks: TaskService,
    private auth: AuthService,
    private projects: ProjectService
  ) {}

  ngOnInit(): void {
    if (!this.auth.isLoggedIn()) { this.router.navigateByUrl('/login'); return; }
    this.projectId = this.route.snapshot.paramMap.get('id') || '';
    this.taskId = this.route.snapshot.paramMap.get('taskId') || '';
    if (!this.projectId || !this.taskId) { this.router.navigateByUrl('/projects'); return; }

    this.fetchMembers();
    this.loadTask();
  }

  private fetchMembers(): void {
    this.loadingMembers = true; this.loadMembersError = null;
    this.projects.getMembers(this.projectId).subscribe({
      next: (list: any[]) => {
        this.loadingMembers = false;
        this.members = (list || []).map(m => ({
          id: m.id ?? m.userId ?? m.memberId ?? '',
          username: m.username ?? '',
          email: m.email ?? ''
        })).filter(m => !!m.id);
      },
      error: (e) => {
        this.loadingMembers = false;
        this.loadMembersError = e?.error?.error || e?.message || 'Impossible de charger les membres';
        this.members = [];
      }
    });
  }

  private loadTask(): void {
    this.loadingTask = true; this.loadError = null;
    this.tasks.get(this.projectId, this.taskId).subscribe({
      next: (t: any) => {
        this.loadingTask = false;
        this.form.patchValue({
          title: t.title ?? '',
          description: t.description ?? '',
          status: (t.status || 'TODO') as TaskStatus,
          priority: (t.priority || 'MEDIUM') as TaskPriority,
          deadline: t.deadline || '',
          endDate: t.endDate || '',
          assigneeId: t.assigneeId || ''
        });
      },
      error: (e) => {
        this.loadingTask = false;
        this.loadError = e?.error?.error || e?.message || 'Impossible de charger la tâche';
      }
    });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true; this.error = null;

    const payload = {
      title: this.form.controls.title.value ?? '',
      description: this.form.controls.description.value ?? '',
      status: (this.form.controls.status.value || 'TODO') as TaskStatus,
      priority: (this.form.controls.priority.value || 'MEDIUM') as TaskPriority,
      deadline: this.form.controls.deadline.value ?? '',
      endDate: this.form.controls.endDate.value ?? '',
      assigneeId: (this.form.controls.assigneeId.value || '') || null
    };

    this.tasks.update(this.projectId, this.taskId, payload).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigateByUrl(`/projects/${this.projectId}`);
      },
      error: (e) => {
        this.loading = false;
        const msg = e?.error?.error || e?.error?.details || e?.message || 'Erreur inconnue';
        this.error = 'Impossible de mettre à jour la tâche : ' + msg;
      }
    });
  }

  get titleCtrl() { return this.form.controls.title; }
}
