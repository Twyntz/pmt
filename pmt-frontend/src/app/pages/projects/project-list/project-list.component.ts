import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { ProjectService } from '../../../services/project.service';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.scss'
})
export class ProjectListComponent implements OnInit, OnDestroy {
  projects: any[] = [];
  loading = false;
  error: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(private projectService: ProjectService) {}

  ngOnInit(): void {
    this.fetchProjects();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private fetchProjects(): void {
    this.loading = true;
    this.error = null;

    this.projectService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any[]) => {
          this.projects = Array.isArray(data) ? data : [];
          this.loading = false;
        },
        error: (err) => {
          console.error('Erreur API projets :', err);
          this.error = 'Impossible de récupérer les projets sur http://localhost:8080.';
          this.loading = false;
        }
      });
  }

  // helpers d’affichage : gère camel/snake et nesting (ex: owner.id)
  val(o: any, a: string, b?: string) { return o?.[a] ?? (b ? o?.[b] : undefined); }
  nested(o: any, path: string) { return path.split('.').reduce((acc, k) => acc?.[k], o); }
  fmtDate(v: any) {
    if (!v) return '—';
    const d = new Date(v);
    return isNaN(+d) ? String(v) : d.toLocaleDateString();
  }
}
