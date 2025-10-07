import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { forkJoin, map, of } from 'rxjs';

import { ProjectService } from '../../services/project.service';
import { TaskService } from '../../services/task.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {

  // Utilisateur courant
  currentUser: any = null;
  currentUserId = '';
  currentUserEmail: string | null = null;

  // Projets filtrés (où je suis owner/admin/member/viewer)
  projects: any[] = [];
  selectedProjectIds: string[] = [];

  // États
  loadingProjects = false;
  loadingTasks = false;
  errorProjects: string | null = null;
  errorTasks: string | null = null;

  // Groupes par statut
  todo: any[] = [];
  inProgress: any[] = [];
  done: any[] = [];

  // Stats
  totals = { all: 0, todo: 0, inProgress: 0, done: 0 };

  constructor(
    private projectsSvc: ProjectService,
    private tasksSvc: TaskService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    if (!this.auth.isLoggedIn()) return; // guard côté routes déjà actif
    this.currentUser = this.auth.getCurrentUser();
    this.currentUserId = (this.currentUser?.id ?? '').toString();
    this.currentUserEmail = this.currentUser?.email ?? null;

    this.loadProjectsAndMembers();
  }

  // =================== Projets + Membres (filtrage par appartenance) ===================
  private loadProjectsAndMembers(): void {
    this.loadingProjects = true;
    this.errorProjects = null;

    this.projectsSvc.getAll().subscribe({
      next: (all) => {
        const list = Array.isArray(all) ? all : [];
        if (!list.length) {
          this.projects = [];
          this.selectedProjectIds = [];
          this.resetColumns();
          this.updateTotals();
          this.loadingProjects = false;
          return;
        }

        const calls = list.map(p =>
          this.projectsSvc.getMembers(p.id).pipe(
            map(members => ({ project: p, members: Array.isArray(members) ? members : [] }))
          )
        );

        forkJoin(calls).subscribe({
          next: (withMembers: any[]) => {
            const allowed = ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'];

            const mine = withMembers.filter(entry => {
              const p = entry.project;
              const members = entry.members;

              const isOwner =
                (p?.ownerId && String(p.ownerId) === this.currentUserId) ||
                (p?.owner?.id && String(p.owner.id) === this.currentUserId);

              const me = members.find((m: any) => {
                const mid = m?.userId ?? m?.id ?? m?.user?.id;
                const memail = m?.email ?? m?.user?.email;
                const role = (m?.role ?? m?.memberRole ?? m?.membershipRole ?? '').toString().toUpperCase();
                const roleOk = allowed.includes(role);
                const idOk = mid ? String(mid) === this.currentUserId : false;
                const emailOk = this.currentUserEmail
                  ? (memail && memail.toString().toLowerCase() === this.currentUserEmail.toLowerCase())
                  : false;
                return roleOk && (idOk || emailOk);
              });

              return Boolean(isOwner || me);
            });

            this.projects = mine.map(x => x.project);
            this.selectedProjectIds = this.projects.map(p => this.getId(p));

            this.loadingProjects = false;
            this.loadTasks();
          },
          error: (e) => {
            this.loadingProjects = false;
            this.errorProjects = e?.error?.error || e?.message || 'Impossible de charger les membres des projets.';
          }
        });
      },
      error: (e) => {
        this.loadingProjects = false;
        this.errorProjects = e?.error?.error || e?.message || 'Impossible de charger les projets.';
      }
    });
  }

  // =================== Tâches ===================
  refresh(): void {
    this.loadTasks();
  }

  // évite le cast dans le template
  toggleProject(p: any, ev: Event): void {
    const input = ev.target as HTMLInputElement | null;
    const checked = !!input?.checked;
    const id = this.getId(p);

    if (checked) {
      if (!this.selectedProjectIds.includes(id)) this.selectedProjectIds.push(id);
    } else {
      this.selectedProjectIds = this.selectedProjectIds.filter(x => x !== id);
    }
    this.loadTasks();
  }

  private loadTasks(): void {
    if (!this.selectedProjectIds.length) {
      this.resetColumns();
      this.updateTotals();
      this.loadingTasks = false;
      return;
    }

    this.loadingTasks = true;
    this.errorTasks = null;

    const calls = this.selectedProjectIds.map(pid => {
      const pname = this.projectNameById(pid);
      return this.tasksSvc.list(pid).pipe(
        map(tasks => (tasks || []).map(t => ({
          ...t,
          projectId: t?.projectId ? String(t.projectId) : pid,
          projectName: pname
        })))
      );
    });

    forkJoin(calls.length ? calls : [of([])]).subscribe({
      next: (arrays: any[][]) => {
        const all = arrays.flat();

        const normalize = (s: string): 'TODO'|'IN_PROGRESS'|'DONE' => {
          const n = (s || '').toUpperCase().trim();
          if (n === 'IN PROGRESS') return 'IN_PROGRESS';
          if (n === 'DONE') return 'DONE';
          if (n === 'IN_PROGRESS') return 'IN_PROGRESS';
          return 'TODO';
        };

        const withStatus = all.map(t => ({ ...t, status: normalize(t.status) }));

        this.todo = withStatus.filter(t => t.status === 'TODO');
        this.inProgress = withStatus.filter(t => t.status === 'IN_PROGRESS');
        this.done = withStatus.filter(t => t.status === 'DONE');

        this.updateTotals();
        this.loadingTasks = false;
      },
      error: (e) => {
        this.loadingTasks = false;
        this.errorTasks = e?.error?.error || e?.message || 'Impossible de charger les tâches.';
        this.resetColumns();
        this.updateTotals();
      }
    });
  }

  // =================== Helpers ===================
  private resetColumns(): void {
    this.todo = []; this.inProgress = []; this.done = [];
  }

  private updateTotals(): void {
    this.totals = {
      all: this.todo.length + this.inProgress.length + this.done.length,
      todo: this.todo.length,
      inProgress: this.inProgress.length,
      done: this.done.length
    };
  }

  /** ID projet en string sans appeler `String()` dans le template */
  getId(p: any): string {
    const id = p?.id ?? p?.projectId ?? p;
    return id != null ? String(id) : '';
  }

  projectNameById(pid: string): string {
    const p = this.projects.find(pp => this.getId(pp) === pid);
    return p?.name || p?.title || ('Projet #' + pid);
  }

  trackById(_: number, item: any) { return item?.id ?? item; }

  createdAtDisplay(val: any): string {
    return (val || '').toString().replace('T', ' ').slice(0, 19) || '—';
    }
}
