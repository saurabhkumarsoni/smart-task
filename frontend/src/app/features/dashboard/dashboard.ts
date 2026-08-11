import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { catchError, finalize, forkJoin, map, of, switchMap } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { Project, Task } from '../../core/models/app-models';
import { ProjectService } from '../../core/services/project.service';
import { TaskService } from '../../core/services/task.service';
import { DashboardMetricCardComponent } from './components/dashboard-metric-card/dashboard-metric-card';
import { DashboardProfileCardComponent } from './components/dashboard-profile-card/dashboard-profile-card';
import { DashboardProjectHealthCardComponent } from './components/dashboard-project-health-card/dashboard-project-health-card';
import { DashboardQuickActionsCardComponent } from './components/dashboard-quick-actions-card/dashboard-quick-actions-card';
import { DashboardStateCardComponent } from './components/dashboard-state-card/dashboard-state-card';
import { DashboardWorkSnapshotCardComponent } from './components/dashboard-work-snapshot-card/dashboard-work-snapshot-card';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    DashboardStateCardComponent,
    DashboardProfileCardComponent,
    DashboardMetricCardComponent,
    DashboardQuickActionsCardComponent,
    DashboardProjectHealthCardComponent,
    DashboardWorkSnapshotCardComponent,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardPage {
  private readonly authService = inject(AuthService);
  private readonly projectService = inject(ProjectService);
  private readonly taskService = inject(TaskService);

  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly projects = signal<Project[]>([]);
  protected readonly tasks = signal<Task[]>([]);

  protected readonly username = computed(() => this.authService.currentUser()?.username ?? 'Guest');

  protected readonly projectCount = computed(() => this.projects().length);
  protected readonly taskCount = computed(() => this.tasks().length);

  protected readonly doneCount = computed(
    () => this.tasks().filter((task) => task.status.toUpperCase() === 'DONE').length,
  );

  protected readonly inProgressCount = computed(
    () => this.tasks().filter((task) => task.status.toUpperCase().includes('PROGRESS')).length,
  );

  protected readonly todoCount = computed(
    () => this.tasks().filter((task) => task.status.toUpperCase() === 'TODO').length,
  );

  protected readonly completionRate = computed(() => {
    const total = this.taskCount();
    if (!total) {
      return 0;
    }

    return Math.round((this.doneCount() / total) * 100);
  });

  protected readonly averageProgress = computed(() => {
    const entries = this.projects()
      .map((project) => project.progress)
      .filter((progress): progress is number => typeof progress === 'number');

    if (!entries.length) {
      return 0;
    }

    const total = entries.reduce((sum, value) => sum + value, 0);
    return Math.round(total / entries.length);
  });

  protected readonly firstBoardRoute = computed(() => {
    const firstProjectId = this.projects()[0]?.id;
    return firstProjectId ? ['/projects', firstProjectId, 'board'] : ['/projects'];
  });

  protected readonly firstSprintRoute = computed(() => {
    const firstProjectId = this.projects()[0]?.id;
    return firstProjectId ? ['/projects', firstProjectId] : ['/projects'];
  });

  protected readonly loadingStateTitle = 'Loading dashboard data...';
  protected readonly loadingStateMessage =
    'Pulling projects, boards, and tasks from your workspace.';

  constructor() {
    this.loadDashboard();
  }

  protected reload(): void {
    this.loadDashboard();
  }

  protected avatarUrl(): string {
    const user = this.username().trim() || 'user';
    return `https://api.dicebear.com/8.x/thumbs/svg?seed=${encodeURIComponent(user)}`;
  }

  private loadDashboard(): void {
    this.loading.set(true);
    this.error.set('');

    this.projectService
      .getProjects()
      .pipe(
        switchMap((projects) => {
          this.projects.set(projects);

          if (!projects.length) {
            return of([] as Task[]);
          }

          return forkJoin(
            projects.map((project) =>
              this.taskService.getTasks(project.id).pipe(catchError(() => of([] as Task[]))),
            ),
          ).pipe(map((taskGroups) => taskGroups.flat()));
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (tasks) => this.tasks.set(tasks),
        error: () => this.error.set('Please check backend connectivity and try again.'),
      });
  }
}
