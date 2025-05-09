import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ProjectListComponent } from './pages/projects/project-list/project-list.component';
import { ProjectDetailsComponent } from './pages/projects/project-details.component';
import { ProjectTasksComponent } from './pages/projects/project-tasks.component';
import { ProjectMembersComponent } from './pages/projects/project-members/project-members.component';
import { ProjectEditComponent } from './pages/projects/project-edit/project-edit.component';
import { TaskDetailsComponent } from './pages/tasks/task-details/task-details.component';
import { ProjectCreateComponent } from './pages/projects/project-create/project-create.component';
import { TaskHistoryComponent } from './pages/tasks/task-history/task-history.component';
import { NotificationsComponent } from './pages/notifications/notifications.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'projects', component: ProjectListComponent }
  { path: 'projects/:id', component: ProjectDetailsComponent }
  { path: 'projects/:id/tasks', component: ProjectTasksComponent }
  { path: 'projects/:id/members', component: ProjectMembersComponent },
  { path: 'projects/create', component: ProjectCreateComponent },
  { path: 'projects/:id/edit', component: ProjectEditComponent },
  { path: 'tasks/:id', component: TaskDetailsComponent },
  { path: 'tasks/:id/history', component: TaskHistoryComponent },
  { path: 'notifications', component: NotificationsComponent },
];
