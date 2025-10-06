import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { TaskService } from '../../../services/task.service';

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

  loading = false;
  error: string | null = null;
  task: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private tasks: TaskService
  ) {}

  ngOnInit(): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigateByUrl('/login'); return;
    }
    this.projectId = this.route.snapshot.paramMap.get('id') || '';
    this.taskId = this.route.snapshot.paramMap.get('taskId') || '';
    if (!this.projectId || !this.taskId) {
      this.router.navigateByUrl('/projects'); return;
    }
    this.load();
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

  goBack(): void {
    this.router.navigateByUrl(`/projects/${this.projectId}`);
  }

  canEdit(): boolean {
    // Simple: toute personne connectée voit, mais on réserve l’édition aux non-viewers si tu gères les rôles côté front.
    // Ici on retourne true par défaut; adapte si tu ajoutes un rôle utilisateur dans le localStorage.
    return true;
  }
}
