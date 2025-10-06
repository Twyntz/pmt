import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { Component } from '@angular/core';
import { authGuard } from './guards/auth.guard';
import { ProjectListComponent } from './pages/projects/project-list/project-list.component';
import { ProjectCreateComponent } from './pages/projects/project-create/project-create.component';
import { ProjectDetailsComponent } from './pages/projects/project-details/project-details.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `<h1 class="text-2xl font-semibold mb-4">Dashboard</h1><p>Bienvenue !</p>`
})
export class DashboardComponent {}

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'projects', component: ProjectListComponent, canActivate: [authGuard] },
  { path: 'projects/create', component: ProjectCreateComponent, canActivate: [authGuard] },
  { path: 'projects/:id', component: ProjectDetailsComponent, canActivate: [authGuard] },  
  { path: '**', redirectTo: 'dashboard' }
];
