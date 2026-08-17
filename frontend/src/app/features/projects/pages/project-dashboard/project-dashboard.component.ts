import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DashboardService } from '../../../dashboard/services/dashboard.service';
import { ProjectDashboard } from '../../../dashboard/models/dashboard.model';
import { ProjectService } from '../../../../core/services/project.service';
import { Project } from '../../../../core/models/app-models';

@Component({
  selector: 'app-project-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './project-dashboard.component.html',
  styleUrl: './project-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDashboardComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly dashboardService = inject(DashboardService);
  private readonly projectService = inject(ProjectService);

  protected readonly projectId = this.route.snapshot.paramMap.get('id') ?? '';
  protected readonly project = signal<Project | null>(null);
  protected readonly data = signal<ProjectDashboard | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly maxStatus = computed(() =>
    Math.max(1, ...(this.data()?.status ?? []).map((x) => x.count)),
  );
  protected readonly maxPriority = computed(() =>
    Math.max(1, ...(this.data()?.priority ?? []).map((x) => x.count)),
  );
  
  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set('');
    this.projectService
      .getProject(this.projectId)
      .subscribe({ next: (value) => this.project.set(value) });
    this.dashboardService.getProjectDashboard(this.projectId).subscribe({
      next: (value) => {
        this.data.set(value);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('We could not load the project dashboard.');
        this.loading.set(false);
      },
    });
  }

  protected label(value: string): string {
    return value.replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  protected width(count: number, max: number): string {
    return `${Math.max(3, Math.round((count / max) * 100))}%`;
  }

  protected initials(): string {
    const name = this.project()?.name || this.data()?.project_name || 'Project';
    const words = name.trim().split(/\s+/);
    return (
      words.length === 1 ? words[0].slice(0, 2) : words[0][0] + words[words.length - 1][0]
    ).toUpperCase();
  }

  protected personInitials(name: string): string {
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase();
  }

  protected daysLabel(date: string): string {
    const target = new Date(`${date}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.ceil((target.getTime() - today.getTime()) / 86400000);
    if (diff < 0) return `${Math.abs(diff)}d overdue`;
    if (diff === 0) return 'Due today';
    if (diff === 1) return 'Due tomorrow';
    return `Due in ${diff}d`;
  }
}
