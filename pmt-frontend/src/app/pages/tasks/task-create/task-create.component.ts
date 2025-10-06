import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { TaskPriority, TaskService, TaskStatus } from '../../../services/task.service';
import { AuthService } from '../../../services/auth.service';
import { ProjectService } from '../../../services/project.service';

@Component({
  selector: 'app-task-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule],
  templateUrl: './task-create.component.html',
  styleUrl: './task-create.component.scss'
})
export class TaskCreateComponent implements OnInit {
  projectId = '';
  loading = false;
  error: string | null = null;

  // membres du projet pour le select
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
    assigneeId: [''] // <= select sur l'id du membre
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
    if (!this.projectId) { this.router.navigateByUrl('/projects'); return; }

    this.fetchMembers();
  }

  private fetchMembers(): void {
    this.loadingMembers = true; this.loadMembersError = null;
    this.projects.getMembers(this.projectId).subscribe({
      next: (list: any[]) => {
        this.loadingMembers = false;
        // normalise un peu les données attendues par l’UI
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
      assigneeId: (this.form.controls.assigneeId.value || '') || null, // null si rien choisi
      // assigneeEmail non utilisé ici, on passe par l'ID
    };

    this.tasks.create(this.projectId, payload).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigateByUrl(`/projects/${this.projectId}`);
      },
      error: (e) => {
        this.loading = false;
        const msg = e?.error?.error || e?.error?.details || e?.message || 'Erreur inconnue';
        this.error = 'Impossible de créer la tâche : ' + msg;
      }
    });
  }

  get titleCtrl() { return this.form.controls.title; }
}
