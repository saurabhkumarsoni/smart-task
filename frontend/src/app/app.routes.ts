import { Routes } from '@angular/router';

import { AppShell } from './shared/components/shell/app-shell';

import { LoginComponent } from './features/auth/pages/login/login.component';
import { RegisterPage } from './features/auth/register/register';
import { ForgotPasswordPage } from './features/auth/forgot-password/forgot-password';
import { ResetPasswordPage } from './features/auth/reset-password/reset-password';
import { VerifyEmailPage } from './features/auth/verify-email/verify-email';
import { ChangePasswordComponent } from './features/auth/pages/change-password/change-password.component';

import { DashboardPage } from './features/dashboard/dashboard';
import { OrganizationsPage } from './features/organizations/organizations';
import { ProjectsPage } from './features/projects/projects';

import { ProjectBoardPage } from './features/projects/pages/project-board/project-board.component';
import { ProjectDetailPage } from './features/projects/project-detail/project-detail';

import { TaskListComponent } from './features/tasks/pages/task-list/task-list.component';
import { TaskDetailComponent } from './features/tasks/pages/task-detail/task-detail.component';
import { BacklogComponent } from './features/tasks/pages/backlog/backlog.component';
import { SprintBoardComponent } from './features/sprints/pages/sprint-board/sprint-board.component';

import { NotificationsPage } from './features/notifications/notifications';
import { SettingsPage } from './features/settings/settings';

import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // --------------------------------------------------
  // Public routes
  // --------------------------------------------------

  {
    path: 'login',
    component: LoginComponent,
  },

  {
    path: 'register',
    component: RegisterPage,
  },

  {
    path: 'forgot-password',
    component: ForgotPasswordPage,
  },

  {
    path: 'reset-password',
    component: ResetPasswordPage,
  },

  {
    path: 'verify-email',
    component: VerifyEmailPage,
  },

  // --------------------------------------------------
  // Authenticated application
  // --------------------------------------------------

  {
    path: '',
    component: AppShell,
    canActivate: [authGuard],

    children: [
      // ------------------------------------------------
      // Default
      // ------------------------------------------------

      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },

      // ------------------------------------------------
      // Global pages
      // ------------------------------------------------

      {
        path: 'dashboard',
        component: DashboardPage,
      },

      {
        path: 'organizations',
        component: OrganizationsPage,
      },

      {
        path: 'organizations/:id',
        component: OrganizationsPage,
      },

      {
        path: 'projects',
        component: ProjectsPage,
      },

      {
        path: 'notifications',
        component: NotificationsPage,
      },

      {
        path: 'settings',
        component: SettingsPage,
      },

      {
        path: 'settings/change-password',
        component: ChangePasswordComponent,
      },

      // ------------------------------------------------
      // Project pages
      // ------------------------------------------------

      {
        path: 'projects/:id',
        component: ProjectDetailPage,
      },

      {
        path: 'projects/:id/overview',
        component: ProjectDetailPage,
      },

      {
        path: 'projects/:id/board',
        component: ProjectBoardPage,
      },

      {
        path: 'projects/:id/backlog',
        component: BacklogComponent,
      },

      {
        path: 'projects/:id/tasks',
        component: TaskListComponent,
      },

      {
        path: 'projects/:id/tasks/:taskId',
        component: TaskDetailComponent,
      },

      {
        path: 'projects/:id/members',
        component: ProjectDetailPage,
      },

      {
        path: 'projects/:id/sprints/:sprintId/board',
        component: SprintBoardComponent,
      },

      {
        path: 'projects/:id/sprints',
        component: ProjectDetailPage,
      },

      {
        path: 'projects/:id/dashboard',
        loadComponent: () =>
          import('./features/projects/pages/project-dashboard/project-dashboard.component').then(
            (m) => m.ProjectDashboardComponent,
          ),
      },
    ],
  },

  // --------------------------------------------------
  // Unknown routes
  // --------------------------------------------------

  {
    path: '**',
    redirectTo: 'login',
  },
];
