import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { TaskHistoryService } from '../../../services/task-history.service';

@Component({
  selector: 'app-task-history',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],
  templateUrl: './task-history.component.html',
  styleUrl: './task-history.component.scss'
})
export class TaskHistoryComponent implements OnInit {
  projectId = '';
  taskId = '';
  loading = false;
  error: string | null = null;
  items: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private historySvc: TaskHistoryService
  ) {}

  ngOnInit(): void {
    if (!this.auth.isLoggedIn()) { this.router.navigateByUrl('/login'); return; }
    this.projectId = this.route.snapshot.paramMap.get('id') || '';
    this.taskId = this.route.snapshot.paramMap.get('taskId') || '';
    if (!this.projectId || !this.taskId) { this.router.navigateByUrl('/projects'); return; }
    this.load();
  }

  load(): void {
    this.loading = true; this.error = null;
    this.historySvc.list(this.projectId, this.taskId).subscribe({
      next: (list) => { this.loading = false; this.items = Array.isArray(list) ? list : []; },
      error: (e) => { this.loading = false; this.error = e?.error?.error || e?.message || 'Erreur inconnue'; }
    });
  }

  goBack(): void {
    this.router.navigateByUrl(`/projects/${this.projectId}/tasks/${this.taskId}`);
  }
}
