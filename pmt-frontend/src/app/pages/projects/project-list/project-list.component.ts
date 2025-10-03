import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { ProjectService } from '../../../services/project.service';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.scss'
})
export class ProjectListComponent implements OnInit {
  projects: any[] = [];
  loading = false;
  error: string | null = null;

  constructor(private projectsSvc: ProjectService) {}

  ngOnInit(): void {
    this.fetch();
  }

  fetch(): void {
    this.loading = true;
    this.error = null;
    this.projectsSvc.getAll().subscribe({
      next: (list) => {
        this.loading = false;
        this.projects = Array.isArray(list) ? list : [];
      },
      error: (e) => {
        this.loading = false;
        const msg = e?.error?.error || e?.message || 'Erreur inconnue';
        this.error = 'Impossible de charger les projets : ' + msg;
        this.projects = [];
      }
    });
  }

  trackById = (_: number, p: any) => p?.id ?? p?._id ?? _;
}
