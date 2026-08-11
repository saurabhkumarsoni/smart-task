import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { ProjectCardComponent } from './components/project-card/project-card.component';
import { loadProjects } from '../../store/projects/actions';
import { selectProjects, selectProjectsLoading } from '../../store/projects/selectors';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, ProjectCardComponent],
  template: `
    <div class="page-card">
      <div class="page-title">
        <h2>Projects</h2>
        <button type="button">+ New Project</button>
      </div>

      @if (loading$ | async) {
        <p class="loading">Loading projects...</p>
      }

      <div class="project-grid">
        <app-project-card *ngFor="let project of projects$ | async" [project]="project" />
      </div>
    </div>
  `,
  styles: [
    `
      .page-card {
        background: rgba(15, 23, 42, 0.82);
        padding: 20px;
        border-radius: 18px;
      }
    `,
    `
      .page-title {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }
    `,
    `
      .project-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 16px;
      }
    `,
    `
      .loading {
        margin: 0 0 12px;
        color: #cbd5e1;
      }
    `,
    `
      button {
        border: 0;
        background: #7c3aed;
        color: white;
        padding: 10px 12px;
        border-radius: 10px;
        cursor: pointer;
      }
    `,
  ],
})
export class ProjectsPage {
  private readonly store = inject(Store);

  protected readonly projects$ = this.store.select(selectProjects);
  protected readonly loading$ = this.store.select(selectProjectsLoading);

  constructor() {
    this.store.dispatch(loadProjects());
  }
}
