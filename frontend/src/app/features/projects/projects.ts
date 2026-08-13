import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../core/services/project.service';
import { Router } from '@angular/router';
import { ProjectCardComponent } from './components/project-card/project-card.component';
import { loadProjects } from '../../store/projects/actions';
import { selectProjects, selectProjectsLoading } from '../../store/projects/selectors';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, FormsModule, ProjectCardComponent],
  template: `
    <div class="page-card">
      <div class="page-title">
        <h2>Projects</h2>
        <button type="button" (click)="creating = !creating">+ New Project</button>
      </div>
      @if (creating) { <form class="create-form" (ngSubmit)="createProject()"><input [(ngModel)]="newProject.name" name="name" placeholder="Project name" required><input [(ngModel)]="newProject.key" name="key" placeholder="Key (e.g. APP)" required><textarea [(ngModel)]="newProject.description" name="description" placeholder="Description"></textarea><button>Create project</button></form> }

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
      .create-form { display:grid; gap:8px; max-width:440px; margin:0 0 16px; }
      input, textarea { padding:8px; }
    `,
  ],
})
export class ProjectsPage {
  private readonly store = inject(Store);
  private readonly projectService = inject(ProjectService);
  private readonly router = inject(Router);
  protected creating = false;
  protected newProject: { name: string; key: string; description?: string } = { name: '', key: '' };

  protected readonly projects$ = this.store.select(selectProjects);
  protected readonly loading$ = this.store.select(selectProjectsLoading);

  constructor() {
    this.store.dispatch(loadProjects());
  }

  protected createProject(): void {
    this.projectService.createProject(this.newProject).subscribe((project) => {
      this.creating = false;
      this.newProject = { name: '', key: '' };
      this.store.dispatch(loadProjects());
      this.router.navigate(['/projects', project.id]);
    });
  }
}
