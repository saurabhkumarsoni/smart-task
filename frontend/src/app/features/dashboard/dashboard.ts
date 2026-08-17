import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardMetricCardComponent } from './components/dashboard-metric-card/dashboard-metric-card';
import { DashboardStateCardComponent } from './components/dashboard-state-card/dashboard-state-card';
import { DashboardBreakdown, WorkspaceDashboard } from './models/dashboard.model';
import { DashboardService } from './services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, DashboardStateCardComponent, DashboardMetricCardComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardPage {
  private readonly service = inject(DashboardService);

  protected readonly loading = signal(true);
  protected readonly refreshing = signal(false);
  protected readonly error = signal('');
  protected readonly data = signal<WorkspaceDashboard | null>(null);

  protected readonly maxStatus = computed(() =>
    Math.max(1, ...(this.data()?.status.map((item) => item.count) ?? [0])),
  );

  protected readonly maxPriority = computed(() =>
    Math.max(1, ...(this.data()?.priority.map((item) => item.count) ?? [0])),
  );

  protected readonly trend = computed(() => this.buildTrend(this.data()));

  protected readonly maxTrend = computed(() =>
    Math.max(1, ...this.trend().flatMap((item) => [item.created, item.completed])),
  );

  protected readonly taskHealth = computed(() => {
    const metrics = this.data()?.metrics;
    return metrics
      ? Math.max(
          0,
          Math.min(100, 100 - Math.round((metrics.overdue / Math.max(1, metrics.tasks)) * 100)),
        )
      : 0;
  });

  protected readonly activeWork = computed(() => {
    const metrics = this.data()?.metrics;
    return metrics ? Math.max(0, metrics.tasks - metrics.completed) : 0;
  });

  constructor() {
    this.load();
  }

  protected reload(): void {
    this.load(true);
  }

  protected label(name: string): string {
    return name.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  protected format(value: number): string {
    return new Intl.NumberFormat('en-IN').format(value);
  }

  protected width(item: DashboardBreakdown, max: number): string {
    return `${Math.max(item.count ? 4 : 0, Math.round((item.count / max) * 100))}%`;
  }

  protected trendHeight(value: number): string {
    return `${Math.max(value ? 5 : 2, Math.round((value / this.maxTrend()) * 100))}%`;
  }

  protected initials(name: string): string {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  }

  protected isOverdue(value: string): boolean {
    return value < new Date().toISOString().slice(0, 10);
  }

  protected dueText(value: string): string {
    if (this.isOverdue(value)) return 'Overdue';
    const target = new Date(`${value}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    return `Due in ${days}d`;
  }

  private load(isRefresh = false): void {
    if (isRefresh) this.refreshing.set(true);
    else this.loading.set(true);

    this.error.set('');

    this.service.getWorkspaceDashboard().subscribe({
      next: (data) => {
        this.data.set(data);
        this.loading.set(false);
        this.refreshing.set(false);
      },
      error: () => {
        this.error.set('Please check backend connectivity and try again.');
        this.loading.set(false);
        this.refreshing.set(false);
      },
    });
  }

  private buildTrend(
    dashboard: WorkspaceDashboard | null,
  ): { date: string; created: number; completed: number }[] {
    if (!dashboard) return [];

    const source = new Map(
      dashboard.trend.map((point) => [
        point.date,
        { created: point.created, completed: point.completed },
      ]),
    );

    const start = new Date(`${dashboard.period.start}T00:00:00`);
    const end = new Date(`${dashboard.period.end}T00:00:00`);
    const points: { date: string; created: number; completed: number }[] = [];

    for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
      const date = cursor.toISOString().slice(0, 10);
      const point = source.get(date);
      points.push({ date, created: point?.created ?? 0, completed: point?.completed ?? 0 });
    }

    return points;
  }
}
