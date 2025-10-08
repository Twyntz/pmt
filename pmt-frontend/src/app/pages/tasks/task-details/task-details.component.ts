import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { TaskService } from '../../../services/task.service';
import { ProjectService } from '../../../services/project.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-task-details',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],
  templateUrl: './task-details.component.html',
  styleUrl: './task-details.component.scss'
})
export class TaskDetailsComponent implements OnInit {
  projectId = '';
  taskId = '';

  task: any = null;
  loading = false;
  error: string | null = null;

  // Pour le contrôle d’accès
  members: any[] = [];
  membersLoaded = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tasks: TaskService,
    private projects: ProjectService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('id') || '';
    this.taskId = this.route.snapshot.paramMap.get('taskId') || '';

    // Charger la tâche + les membres du projet (pour savoir si on peut éditer)
    this.load();
    this.loadMembers();
  }

  load(): void {
    this.loading = true; this.error = null;
    this.tasks.get(this.projectId, this.taskId).subscribe({
      next: (t) => { this.loading = false; this.task = t; },
      error: (e) => {
        this.loading = false;
        this.error = e?.error?.error || e?.message || 'Erreur inconnue';
      }
    });
  }

  loadMembers(): void {
    this.membersLoaded = false;
    this.projects.getMembers(this.projectId).subscribe({
      next: (list) => { this.members = Array.isArray(list) ? list : []; this.membersLoaded = true; },
      error: () => { this.members = []; this.membersLoaded = true; }
    });
  }

  /** OWNER, ADMIN, MEMBER => peuvent modifier */
  isMemberOrAbove(): boolean {
    const current = this.auth.getCurrentUser();
    if (!current) return false;

    // Owner
    const ownerId = this.task?.projectOwnerId || this.task?.project?.ownerId || this.task?.project?.owner?.id;
    if (ownerId && ownerId === current.id) return true;

    // Cherche le rôle du user dans les membres
    const me = (this.members || []).find(m =>
      m?.id === current.id || m?.userId === current.id || m?.email === current.email
    );
    return me?.role === 'ADMIN' || me?.role === 'MEMBER';
  }
}
