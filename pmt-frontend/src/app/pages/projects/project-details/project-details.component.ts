import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ProjectService } from '../../../services/project.service';
import { TaskService } from '../../../services/task.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-project-details',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './project-details.component.html',
  styleUrl: './project-details.component.scss'
})
export class ProjectDetailsComponent implements OnInit {
  projectId = '';
  project: any = null;

  ownerName = '';
  ownerError: string | null = null;

  members: any[] = [];
  tasks: any[] = [];

  loadingProject = false;
  loadingMembers = false;
  loadingTasks = false;
  inviting = false;

  errorProject: string | null = null;
  errorMembers: string | null = null;
  errorTasks: string | null = null;
  inviteError: string | null = null;
  inviteSuccess: string | null = null;

  inviteForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    role: ['MEMBER']
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projects: ProjectService,
    private tasksSvc: TaskService,
    private auth: AuthService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    if (!this.auth.isLoggedIn()) { this.router.navigateByUrl('/login'); return; }
    this.projectId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.projectId) { this.router.navigateByUrl('/projects'); return; }
    this.loadProject();
    this.loadMembers();
    this.loadTasks();
  }

  loadProject(): void {
    this.loadingProject = true; this.errorProject = null;
    this.projects.getById(this.projectId).subscribe({
      next: (p) => {
        this.loadingProject = false;
        this.project = p;
        const ownerId = p?.ownerId || p?.owner_id || p?.owner?.id;
        if (ownerId) {
          this.projects.getUserById(ownerId).subscribe({
            next: (u) => { this.ownerName = u?.username || u?.email || ''; },
            error: () => { this.ownerName = ''; this.ownerError = 'Impossible de récupérer le propriétaire'; }
          });
        } else {
          this.ownerName = p?.owner?.username || p?.owner?.email || '';
        }
      },
      error: (e) => {
        this.loadingProject = false;
        this.errorProject = e?.error?.error || e?.message || 'Erreur inconnue';
      }
    });
  }

  loadMembers(): void {
    this.loadingMembers = true; this.errorMembers = null;
    this.projects.getMembers(this.projectId).subscribe({
      next: (list) => { this.loadingMembers = false; this.members = Array.isArray(list) ? list : []; },
      error: (e) => { this.loadingMembers = false; this.errorMembers = e?.error?.error || e?.message || 'Erreur inconnue'; this.members = []; }
    });
  }

  loadTasks(): void {
    this.loadingTasks = true; this.errorTasks = null;
    this.tasksSvc.list(this.projectId).subscribe({
      next: (list) => { this.loadingTasks = false; this.tasks = Array.isArray(list) ? list : []; },
      error: (e) => { this.loadingTasks = false; this.errorTasks = e?.error?.error || e?.message || 'Erreur inconnue'; this.tasks = []; }
    });
  }

  invite(): void {
    if (this.inviteForm.invalid) { this.inviteForm.markAllAsTouched(); return; }
    this.inviting = true; this.inviteError = null; this.inviteSuccess = null;

    const email = this.inviteForm.controls.email.value || '';
    const role = this.inviteForm.controls.role.value || 'MEMBER';

    this.projects.inviteMember(this.projectId, email, role).subscribe({
      next: () => {
        this.inviting = false;
        this.inviteSuccess = `Invitation envoyée à ${email}`;
        this.inviteForm.reset({ email: '', role: 'MEMBER' });
        this.loadMembers();
      },
      error: (e) => {
        this.inviting = false;
        const msg = e?.error?.error || e?.error?.details || e?.message || 'Erreur inconnue';
        this.inviteError = 'Impossible d’inviter : ' + msg;
      }
    });
  }

  /** OWNER ou ADMIN peuvent inviter */
  canInvite(): boolean {
    const current = this.auth.getCurrentUser();
    if (!current || !this.project) return false;
    const ownerId = this.project.ownerId || this.project.owner?.id;
    if (ownerId && ownerId === current.id) return true;
    const me = (this.members || []).find(m =>
      m?.id === current.id || m?.userId === current.id || m?.email === current.email
    );
    return me?.role === 'ADMIN';
  }

  /** OWNER, ADMIN, MEMBER => peuvent créer/modifier */
  isMemberOrAbove(): boolean {
    const current = this.auth.getCurrentUser();
    if (!current || !this.project) return false;
    const ownerId = this.project.ownerId || this.project.owner?.id;
    if (ownerId && ownerId === current.id) return true;
    const me = (this.members || []).find(m =>
      m?.id === current.id || m?.userId === current.id || m?.email === current.email
    );
    return me?.role === 'ADMIN' || me?.role === 'MEMBER';
  }
}
