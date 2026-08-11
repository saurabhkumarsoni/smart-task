import { Component, Input } from '@angular/core';
import { Project } from '../../../../core/models/app-models';

@Component({
  selector: 'app-dashboard-project-health-card',
  standalone: true,
  template: `
    <article class="card">
      <div class="card-head">
        <h3>Project health</h3>
        <span class="badge">Avg {{ averageProgress }}%</span>
      </div>
      <ul>
        @for (project of topProjects(); track project.id) {
          <li>
            <div>
              <strong>{{ project.name }}</strong>
              <small>{{ project.tasksCount ?? 0 }} tasks</small>
            </div>
            <em>{{ project.progress ?? 0 }}%</em>
          </li>
        }
      </ul>
    </article>
  `,
  styles: [
    `
      .card {
        background: #fff;
        border: 1px solid #dbe5f1;
        border-radius: 16px;
        padding: 16px;
      }

      .card-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      h3 {
        margin: 0;
        font-size: 1rem;
      }

      .badge {
        background: #eef4ff;
        color: #1e40af;
        font-size: 0.78rem;
        font-weight: 700;
        border-radius: 999px;
        padding: 6px 10px;
      }

      ul {
        list-style: none;
        margin: 14px 0 0;
        padding: 0;
        display: grid;
        gap: 10px;
      }

      li {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 10px 12px;
        border-radius: 12px;
        border: 1px solid #e2e8f0;
      }

      strong {
        display: block;
        font-size: 0.9rem;
      }

      small,
      em {
        color: #64748b;
        font-size: 0.8rem;
        font-style: normal;
      }
    `,
  ],
})
export class DashboardProjectHealthCardComponent {
  @Input({ required: true }) projects: Project[] = [];
  @Input({ required: true }) averageProgress = 0;

  protected topProjects(): Project[] {
    return this.projects.slice(0, 4);
  }
}
