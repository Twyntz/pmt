import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ProjectListComponent } from './pages/projects/project-list/project-list.component';

export const routes: Routes = [
  { path: '/', component: DashboardComponent },
  { path: '/projects', component: ProjectListComponent },
];
