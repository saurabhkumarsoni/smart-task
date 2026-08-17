import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Project } from '../../../../core/models/app-models';

@Component({
  selector: 'app-project-card',
  standalone: true,
  imports: [CommonModule, RouterLink],

  template: `
    <article class="project-card">
      <!-- ============================================= -->
      <!-- Card Header -->
      <!-- ============================================= -->

      <div class="card-header">
        <div class="project-icon">
          {{ getInitials() }}
        </div>

        <div class="project-heading">
          <div class="project-key">
            {{ project.key || 'PROJECT' }}
          </div>

          <h3>
            {{ project.name }}
          </h3>
        </div>

        <span
          class="status"
          [class.active]="project.is_active !== false"
          [class.inactive]="project.is_active === false"
        >
          <span class="status-dot"></span>

          {{ project.is_active === false ? 'Inactive' : 'Active' }}
        </span>
      </div>

      <!-- ============================================= -->
      <!-- Description -->
      <!-- ============================================= -->

      <p class="description">
        {{ project.description || 'No project description available.' }}
      </p>

      <!-- ============================================= -->
      <!-- Project Statistics -->
      <!-- ============================================= -->

      <div class="stats">
        <div class="stat">
          <span class="stat-label"> Owner </span>

          <strong>
            {{ ownerName }}
          </strong>
        </div>

        <div class="stat">
          <span class="stat-label"> Members </span>

          <strong>
            {{ memberCount }}
          </strong>
        </div>

        <div class="stat">
          <span class="stat-label"> Tasks </span>

          <strong>
            {{ taskCount }}
          </strong>
        </div>
      </div>

      <!-- ============================================= -->
      <!-- Progress -->
      <!-- ============================================= -->

      <div class="progress-section">
        <div class="progress-heading">
          <span> Progress </span>

          <strong> {{ progress }}% </strong>
        </div>

        <div class="progress-track">
          <div class="progress-bar" [style.width.%]="progress"></div>
        </div>
      </div>

      <!-- ============================================= -->
      <!-- Footer -->
      <!-- ============================================= -->

      <div class="card-footer">
        <span class="task-count">
          {{ taskCount }}

          {{ taskCount === 1 ? 'task' : 'tasks' }}
        </span>

        <a class="open-project" [routerLink]="['/projects', project.id]">
          Open project

          <span> → </span>
        </a>
      </div>
    </article>
  `,

  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }

      /* ================================================
       Card
       ================================================ */

      .project-card {
        position: relative;
        display: flex;
        flex-direction: column;
        height: 100%;
        min-height: 285px;
        box-sizing: border-box;
        padding: 20px;

        border: 1px solid #e2e8f0;
        border-radius: 15px;

        background: #ffffff;

        box-shadow:
          0 2px 5px rgba(15, 23, 42, 0.025),
          0 10px 25px rgba(15, 23, 42, 0.035);

        transition:
          transform 0.2s ease,
          box-shadow 0.2s ease,
          border-color 0.2s ease;

        overflow: hidden;
      }

      .project-card::before {
        content: '';

        position: absolute;

        top: 0;
        left: 0;
        right: 0;

        height: 3px;

        background: linear-gradient(90deg, #7c3aed, #8b5cf6, #a78bfa);

        opacity: 0.8;
      }

      .project-card:hover {
        transform: translateY(-3px);

        border-color: #ddd6fe;

        box-shadow:
          0 8px 18px rgba(15, 23, 42, 0.06),
          0 18px 40px rgba(124, 58, 237, 0.08);
      }

      /* ================================================
       Header
       ================================================ */

      .card-header {
        display: flex;
        align-items: flex-start;
        gap: 12px;
      }

      .project-icon {
        display: flex;
        align-items: center;
        justify-content: center;

        width: 44px;
        height: 44px;

        flex: 0 0 44px;

        border-radius: 11px;

        background: linear-gradient(135deg, #ede9fe, #f5f3ff);

        color: #6d28d9;

        font-size: 15px;
        font-weight: 800;
        letter-spacing: 0.02em;
      }

      .project-heading {
        min-width: 0;
        flex: 1;
      }

      .project-key {
        margin-bottom: 3px;

        color: #8b5cf6;

        font-size: 10px;
        font-weight: 800;

        letter-spacing: 0.1em;
        text-transform: uppercase;
      }

      h3 {
        margin: 0;

        color: #0f172a;

        font-size: 17px;
        line-height: 1.3;

        font-weight: 700;

        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      /* ================================================
       Status
       ================================================ */

      .status {
        display: inline-flex;
        align-items: center;
        gap: 5px;

        padding: 5px 8px;

        border-radius: 999px;

        font-size: 10px;
        font-weight: 700;

        white-space: nowrap;
      }

      .status.active {
        background: #ecfdf3;
        color: #15803d;
      }

      .status.inactive {
        background: #f1f5f9;
        color: #64748b;
      }

      .status-dot {
        width: 6px;
        height: 6px;

        border-radius: 50%;

        background: currentColor;
      }

      /* ================================================
       Description
       ================================================ */

      .description {
        display: -webkit-box;

        margin: 17px 0 18px;

        color: #64748b;

        font-size: 13px;
        line-height: 1.6;

        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;

        overflow: hidden;

        min-height: 62px;
      }

      /* ================================================
       Statistics
       ================================================ */

      .stats {
        display: grid;

        grid-template-columns: repeat(3, 1fr);

        gap: 8px;

        padding: 12px;

        border-radius: 10px;

        background: #f8fafc;

        border: 1px solid #f1f5f9;
      }

      .stat {
        min-width: 0;
      }

      .stat-label {
        display: block;

        margin-bottom: 4px;

        color: #94a3b8;

        font-size: 10px;
        font-weight: 650;

        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .stat strong {
        display: block;

        color: #334155;

        font-size: 12px;
        font-weight: 650;

        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      /* ================================================
       Progress
       ================================================ */

      .progress-section {
        margin-top: 17px;
      }

      .progress-heading {
        display: flex;

        align-items: center;
        justify-content: space-between;

        margin-bottom: 7px;

        color: #64748b;

        font-size: 11px;
      }

      .progress-heading strong {
        color: #475569;
        font-weight: 700;
      }

      .progress-track {
        width: 100%;
        height: 7px;

        overflow: hidden;

        border-radius: 999px;

        background: #edf0f4;
      }

      .progress-bar {
        height: 100%;

        border-radius: inherit;

        background: linear-gradient(90deg, #7c3aed, #8b5cf6);

        transition: width 0.35s ease;
      }

      /* ================================================
       Footer
       ================================================ */

      .card-footer {
        display: flex;

        align-items: center;
        justify-content: space-between;

        gap: 12px;

        margin-top: auto;
        padding-top: 17px;
      }

      .task-count {
        color: #94a3b8;
        font-size: 12px;
      }

      .open-project {
        display: inline-flex;

        align-items: center;
        gap: 6px;

        color: #6d28d9;

        font-size: 12px;
        font-weight: 700;

        text-decoration: none;

        transition: gap 0.18s ease;
      }

      .open-project:hover {
        gap: 9px;
        color: #5b21b6;
      }

      /* ================================================
       Responsive
       ================================================ */

      @media (max-width: 480px) {
        .project-card {
          min-height: 270px;
          padding: 17px;
        }

        .status {
          display: none;
        }

        .stats {
          gap: 5px;
          padding: 10px;
        }
      }
    `,
  ],
})
export class ProjectCardComponent {
  @Input({
    required: true,
  })
  project!: Project;

  protected get ownerName(): string {
    return this.project.owner_name?.trim() || this.project.owner?.trim() || 'Not assigned';
  }

  protected get memberCount(): number {
    return this.project.member_count ?? this.project.members ?? 0;
  }

  protected get taskCount(): number {
    return this.project.task_count ?? this.project.tasksCount ?? 0;
  }

  protected get progress(): number {
    const explicit = Number(this.project.progress);

    if (!Number.isNaN(explicit)) {
      return Math.min(100, Math.max(0, Math.round(explicit)));
    }

    const total = this.taskCount;
    const completed = this.project.completed_task_count ?? 0;

    if (!total) {
      return 0;
    }

    return Math.min(100, Math.max(0, Math.round((completed / total) * 100)));
  }

  protected getInitials(): string {
    const name = this.project.name?.trim() || 'PR';

    const words = name.split(/\s+/).filter(Boolean);

    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }

    return name.substring(0, 2).toUpperCase();
  }
}
