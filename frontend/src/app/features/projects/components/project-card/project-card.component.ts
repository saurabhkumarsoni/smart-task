import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Project } from '../../../../core/models/app-models';

@Component({
  selector: 'app-project-card',
  standalone: true,
  imports: [RouterLink],
  template: `
    <article class="card">
      <h3>{{ project.name }}</h3>
      <p>{{ project.description }}</p>

      <div class="meta-row">
        <span>Owner: {{ project.owner || 'N/A' }}</span>
        <span>Members: {{ project.members ?? 0 }}</span>
      </div>

      <div class="progress">
        <div class="bar" [style.width.%]="project.progress ?? 0"></div>
      </div>

      <div class="meta-row">
        <span>{{ project.tasksCount ?? 0 }} tasks</span>
        <a [routerLink]="['/projects', project.id]">Open</a>
      </div>
    </article>
  `,
  styles: [
    `
      .card {
        border: 1px solid rgba(255, 255, 255, 0.08);
        padding: 16px;
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.06);
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .meta-row {
        display: flex;
        justify-content: space-between;
        color: #94a3b8;
        font-size: 0.95rem;
      }

      .progress {
        height: 8px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.1);
        overflow: hidden;
      }

      .bar {
        height: 100%;
        background: linear-gradient(90deg, #38bdf8, #7c3aed);
      }

      a {
        color: #7dd3fc;
        text-decoration: none;
      }
    `,
  ],
})
export class ProjectCardComponent {
  @Input({ required: true }) project!: Project;
}
