import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Project, ProjectOverview } from '../../../../core/models/app-models';

@Component({
  selector: 'app-project-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './project-overview.component.html',
  styleUrl: './project-overview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectOverviewComponent {
  @Input() project: Project | null = null;
  @Input() overview: ProjectOverview | null = null;
  @Input() loading = false;

  protected get progress(): number {
    if (!this.overview?.total_tasks) return 0;
    return Math.round((this.overview.completed_tasks / this.overview.total_tasks) * 100);
  }
}
