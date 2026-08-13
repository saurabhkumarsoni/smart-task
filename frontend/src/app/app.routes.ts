import { Routes } from '@angular/router';
import { AppShell } from './shared/components/shell/app-shell';
import { LoginPage } from './features/auth/login/login';
import { RegisterPage } from './features/auth/register/register';
import { ForgotPasswordPage } from './features/auth/forgot-password/forgot-password';
import { ResetPasswordPage } from './features/auth/reset-password/reset-password';
import { VerifyEmailPage } from './features/auth/verify-email/verify-email';
import { ChangePasswordPage } from './features/auth/change-password/change-password';
import { DashboardPage } from './features/dashboard/dashboard';
import { OrganizationsPage } from './features/organizations/organizations';
import { ProjectsPage } from './features/projects/projects';
import { ProjectDetailPage } from './features/projects/project-detail/project-detail';
import { ProjectBoardPage } from './features/projects/project-board/project-board';
import { TaskListComponent } from './features/tasks/pages/task-list/task-list.component';
import { TaskDetailComponent } from './features/tasks/pages/task-detail/task-detail.component';
import { BacklogComponent } from './features/tasks/pages/backlog/backlog.component';
import { NotificationsPage } from './features/notifications/notifications';
import { SettingsPage } from './features/settings/settings';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginPage },
  { path: 'register', component: RegisterPage },
  { path: 'forgot-password', component: ForgotPasswordPage },
  { path: 'reset-password', component: ResetPasswordPage },
  { path: 'verify-email', component: VerifyEmailPage },
  {
    path: '',
    component: AppShell,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardPage },
      { path: 'organizations', component: OrganizationsPage },
      { path: 'organizations/:id', component: OrganizationsPage },
      { path: 'projects', component: ProjectsPage },
      { path: 'projects/:id/board', component: ProjectBoardPage },
      { path: 'projects/:id/backlog', component: BacklogComponent },
      { path: 'projects/:id/tasks/:taskId', component: TaskDetailComponent },
      { path: 'projects/:id/tasks', component: TaskListComponent },
      { path: 'projects/:id/overview', component: ProjectDetailPage },
      { path: 'projects/:id/members', component: ProjectDetailPage },
      { path: 'projects/:id/sprints', component: ProjectDetailPage },
      { path: 'projects/:id/dashboard', component: DashboardPage },
      { path: 'projects/:id', component: ProjectDetailPage },
      { path: 'notifications', component: NotificationsPage },
      { path: 'settings', component: SettingsPage },
      { path: 'settings/change-password', component: ChangePasswordPage },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
