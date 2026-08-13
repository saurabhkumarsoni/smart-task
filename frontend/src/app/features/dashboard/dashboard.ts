import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { DashboardMetricCardComponent } from './components/dashboard-metric-card/dashboard-metric-card';
import { DashboardStateCardComponent } from './components/dashboard-state-card/dashboard-state-card';
import { DashboardBreakdown, WorkspaceDashboard } from './models/dashboard.model';
import { DashboardService } from './services/dashboard.service';

@Component({ selector: 'app-dashboard', standalone: true, imports: [CommonModule, DashboardStateCardComponent, DashboardMetricCardComponent], templateUrl: './dashboard.html', styleUrl: './dashboard.scss' })
export class DashboardPage {
  private readonly service = inject(DashboardService);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly data = signal<WorkspaceDashboard | null>(null);
  protected readonly maxStatus = computed(() => Math.max(1, ...this.data()?.status.map((item) => item.count) ?? [0]));
  protected readonly maxPriority = computed(() => Math.max(1, ...this.data()?.priority.map((item) => item.count) ?? [0]));
  protected readonly maxTrend = computed(() => Math.max(1, ...this.data()?.trend.flatMap((item) => [item.created, item.completed]) ?? [0]));
  protected readonly taskHealth = computed(() => {
    const metrics = this.data()?.metrics;
    return metrics ? Math.max(0, 100 - Math.round(metrics.overdue / Math.max(1, metrics.tasks) * 100)) : 0;
  });
  constructor() { this.load(); }
  protected reload() { this.load(); }
  protected label(name: string) { return name.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()); }
  protected format(value: number) { return new Intl.NumberFormat('en-IN').format(value); }
  protected width(item: DashboardBreakdown, max: number) { return `${Math.round(item.count / max * 100)}%`; }
  protected trendHeight(value: number) { return `${Math.max(3, Math.round(value / this.maxTrend() * 100))}%`; }
  protected initials(name: string) { return name.split(' ').slice(0, 2).map((word) => word[0]).join('').toUpperCase(); }
  protected isOverdue(value: string) { return value < new Date().toISOString().slice(0, 10); }
  private load() { this.loading.set(true); this.error.set(''); this.service.getWorkspaceDashboard().subscribe({ next: (data) => { this.data.set(data); this.loading.set(false); }, error: () => { this.error.set('Please check backend connectivity and try again.'); this.loading.set(false); } }); }
}
