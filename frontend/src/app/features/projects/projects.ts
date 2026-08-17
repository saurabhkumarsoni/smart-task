import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';

import { ProjectService } from '../../core/services/project.service';
import { Project } from '../../core/models/app-models';

import { ProjectCardComponent } from './components/project-card/project-card.component';

import {
  loadProjects,
} from '../../store/projects/actions';

import {
  selectProjects,
  selectProjectsLoading,
} from '../../store/projects/selectors';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ProjectCardComponent,
  ],
  template: `
    <main class="projects-page">

      <!-- ================================================= -->
      <!-- Page Header -->
      <!-- ================================================= -->

      <section class="page-header">

        <div class="header-content">

          <div class="breadcrumb">
            <span>Workspace</span>
            <span class="breadcrumb-separator">/</span>
            <strong>Projects</strong>
          </div>

          <div class="title-row">

            <div>
              <h1>Projects</h1>

              <p class="page-description">
                Manage your projects, teams and delivery progress
                from one place.
              </p>
            </div>

            <button
              type="button"
              class="primary-button"
              (click)="toggleCreateForm()"
            >
              <span class="button-icon">
                +
              </span>

              New Project
            </button>

          </div>

        </div>

      </section>


      <!-- ================================================= -->
      <!-- Create Project -->
      <!-- ================================================= -->

      @if (creating) {

        <section class="create-panel">

          <div class="create-panel-header">

            <div class="create-icon">
              +
            </div>

            <div>
              <h2>Create a new project</h2>

              <p>
                Set up a project and start organizing your work.
              </p>
            </div>

            <button
              type="button"
              class="close-button"
              (click)="creating = false"
              aria-label="Close"
            >
              ×
            </button>

          </div>


          <form
            class="create-form"
            (ngSubmit)="createProject()"
            #projectForm="ngForm"
          >

            <div class="form-grid">

              <!-- Project Name -->

              <div class="form-field">

                <label for="projectName">
                  Project name
                  <span>*</span>
                </label>

                <input
                  id="projectName"
                  type="text"
                  [(ngModel)]="newProject.name"
                  name="name"
                  placeholder="e.g. Smart Task"
                  autocomplete="off"
                  required
                />

                <small>
                  A clear name helps your team identify the project.
                </small>

              </div>


              <!-- Project Key -->

              <div class="form-field">

                <label for="projectKey">
                  Project key
                  <span>*</span>
                </label>

                <input
                  id="projectKey"
                  type="text"
                  [(ngModel)]="newProject.key"
                  name="key"
                  placeholder="e.g. APP"
                  maxlength="10"
                  autocomplete="off"
                  required
                  (input)="normalizeProjectKey()"
                />

                <small>
                  Used for task identifiers such as APP-101.
                </small>

              </div>

            </div>


            <!-- Description -->

            <div class="form-field">

              <label for="projectDescription">
                Description
              </label>

              <textarea
                id="projectDescription"
                [(ngModel)]="newProject.description"
                name="description"
                rows="4"
                placeholder="Describe what this project is about..."
              ></textarea>

            </div>


            <div class="form-actions">

              <button
                type="button"
                class="secondary-button"
                (click)="cancelCreate()"
              >
                Cancel
              </button>

              <button
                type="submit"
                class="primary-button"
                [disabled]="projectForm.invalid || creatingProject"
              >

                @if (creatingProject) {

                  <span class="spinner"></span>

                  Creating...

                } @else {

                  <span>+</span>

                  Create project

                }

              </button>

            </div>

          </form>

        </section>

      }


      <!-- ================================================= -->
      <!-- Toolbar -->
      <!-- ================================================= -->

      <section class="toolbar">

        <div class="toolbar-left">

          <div class="search-box">

            <span class="search-icon">
              ⌕
            </span>

            <input
              type="search"
              [(ngModel)]="searchTerm"
              placeholder="Search projects..."
              aria-label="Search projects"
            />

            @if (searchTerm) {

              <button
                type="button"
                class="clear-search"
                (click)="searchTerm = ''"
                aria-label="Clear search"
              >
                ×
              </button>

            }

          </div>

        </div>


        <div class="toolbar-right">

          <span class="project-count">

            @if ((projects$ | async); as projects) {

              {{ filteredProjects(projects).length }}

              {{
                filteredProjects(projects).length === 1
                  ? 'project'
                  : 'projects'
              }}

            }

          </span>

          <button
            type="button"
            class="refresh-button"
            [disabled]="loading$ | async"
            (click)="refreshProjects()"
          >

            @if (loading$ | async) {

              <span class="spinner small"></span>

            } @else {

              ↻

            }

            Refresh

          </button>

        </div>

      </section>


      <!-- ================================================= -->
      <!-- Loading -->
      <!-- ================================================= -->

      @if (loading$ | async) {

        <section class="project-grid">

          @for (item of skeletonItems; track item) {

            <article class="project-skeleton">

              <div class="skeleton skeleton-title"></div>

              <div class="skeleton skeleton-line"></div>

              <div class="skeleton skeleton-line short"></div>

              <div class="skeleton-row">

                <div class="skeleton skeleton-small"></div>

                <div class="skeleton skeleton-small"></div>

              </div>

              <div class="skeleton skeleton-progress"></div>

            </article>

          }

        </section>

      }


      <!-- ================================================= -->
      <!-- Projects -->
      <!-- ================================================= -->

      @else {

        @if ((projects$ | async); as projects) {

          @if (filteredProjects(projects).length) {

            <section class="project-grid">

              @for (
                project of filteredProjects(projects);
                track project.id
              ) {

                <div class="project-card-wrapper">

                  <app-project-card
                    [project]="project"
                  />

                </div>

              }

            </section>

          }


          <!-- ================================================= -->
          <!-- Empty Search -->
          <!-- ================================================= -->

          @else if (searchTerm) {

            <section class="empty-state">

              <div class="empty-icon">
                ⌕
              </div>

              <h2>
                No projects found
              </h2>

              <p>
                We couldn't find any projects matching
                "{{ searchTerm }}".
              </p>

              <button
                type="button"
                class="secondary-button"
                (click)="searchTerm = ''"
              >
                Clear search
              </button>

            </section>

          }


          <!-- ================================================= -->
          <!-- No Projects -->
          <!-- ================================================= -->

          @else {

            <section class="empty-state">

              <div class="empty-icon">
                +
              </div>

              <h2>
                No projects yet
              </h2>

              <p>
                Create your first project and start organizing
                your team's work.
              </p>

              <button
                type="button"
                class="primary-button"
                (click)="creating = true"
              >
                <span>+</span>
                Create your first project
              </button>

            </section>

          }

        }

      }

    </main>
  `,

  styles: [`

    /* =========================================================
       Page
       ========================================================= */

    :host {
      display: block;
      width: 100%;
    }

    .projects-page {
      width: 100%;
      max-width: 1500px;
      margin: 0 auto;
      padding: 28px 32px 48px;
      box-sizing: border-box;
      color: #172033;
    }


    /* =========================================================
       Header
       ========================================================= */

    .page-header {
      margin-bottom: 26px;
    }

    .header-content {
      width: 100%;
    }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 9px;
      margin-bottom: 14px;
      font-size: 13px;
      color: #94a3b8;
    }

    .breadcrumb strong {
      color: #475569;
      font-weight: 600;
    }

    .breadcrumb-separator {
      color: #cbd5e1;
    }

    .title-row {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 24px;
    }

    h1 {
      margin: 0;
      font-size: 32px;
      line-height: 1.15;
      letter-spacing: -0.03em;
      font-weight: 750;
      color: #0f172a;
    }

    .page-description {
      margin: 9px 0 0;
      color: #64748b;
      font-size: 15px;
      line-height: 1.6;
    }


    /* =========================================================
       Buttons
       ========================================================= */

    button {
      font-family: inherit;
    }

    .primary-button,
    .secondary-button,
    .refresh-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      min-height: 42px;
      padding: 0 16px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 650;
      cursor: pointer;
      transition:
        background .18s ease,
        border-color .18s ease,
        box-shadow .18s ease,
        transform .18s ease;
    }

    .primary-button {
      border: 1px solid #6d28d9;
      background: #7c3aed;
      color: #fff;
      box-shadow: 0 5px 14px rgba(124, 58, 237, .18);
    }

    .primary-button:hover:not(:disabled) {
      background: #6d28d9;
      transform: translateY(-1px);
      box-shadow: 0 8px 18px rgba(124, 58, 237, .22);
    }

    .secondary-button {
      border: 1px solid #dbe3ee;
      background: #fff;
      color: #334155;
    }

    .secondary-button:hover:not(:disabled) {
      background: #f8fafc;
      border-color: #cbd5e1;
    }

    .refresh-button {
      min-height: 38px;
      padding: 0 12px;
      border: 1px solid #dbe3ee;
      background: #fff;
      color: #475569;
    }

    .refresh-button:hover:not(:disabled) {
      background: #f8fafc;
      border-color: #cbd5e1;
    }

    button:disabled {
      opacity: .55;
      cursor: not-allowed;
    }

    .button-icon {
      font-size: 20px;
      line-height: 1;
      font-weight: 400;
    }


    /* =========================================================
       Create panel
       ========================================================= */

    .create-panel {
      margin-bottom: 24px;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      background: #fff;
      box-shadow:
        0 10px 30px rgba(15, 23, 42, .06);
      overflow: hidden;
    }

    .create-panel-header {
      display: flex;
      align-items: center;
      gap: 13px;
      padding: 20px 22px;
      background:
        linear-gradient(
          135deg,
          #faf7ff 0%,
          #fff 100%
        );
      border-bottom: 1px solid #edf1f6;
    }

    .create-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 42px;
      height: 42px;
      flex: 0 0 42px;
      border-radius: 11px;
      background: #ede9fe;
      color: #6d28d9;
      font-size: 25px;
      font-weight: 400;
    }

    .create-panel-header h2 {
      margin: 0;
      color: #0f172a;
      font-size: 17px;
      font-weight: 700;
    }

    .create-panel-header p {
      margin: 4px 0 0;
      color: #64748b;
      font-size: 13px;
    }

    .close-button {
      margin-left: auto;
      width: 34px;
      height: 34px;
      border: 0;
      border-radius: 8px;
      background: transparent;
      color: #64748b;
      font-size: 24px;
      cursor: pointer;
    }

    .close-button:hover {
      background: #f1f5f9;
      color: #0f172a;
    }

    .create-form {
      padding: 22px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1.5fr 1fr;
      gap: 18px;
      margin-bottom: 18px;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 7px;
    }

    .form-field label {
      font-size: 13px;
      font-weight: 650;
      color: #334155;
    }

    .form-field label span {
      color: #dc2626;
    }

    .form-field input,
    .form-field textarea {
      width: 100%;
      box-sizing: border-box;
      border: 1px solid #d7dee8;
      border-radius: 9px;
      background: #fff;
      color: #0f172a;
      padding: 11px 12px;
      font-family: inherit;
      font-size: 14px;
      outline: none;
      transition:
        border-color .18s ease,
        box-shadow .18s ease;
    }

    .form-field input {
      height: 44px;
    }

    .form-field textarea {
      min-height: 100px;
      resize: vertical;
    }

    .form-field input::placeholder,
    .form-field textarea::placeholder {
      color: #a8b3c2;
    }

    .form-field input:focus,
    .form-field textarea:focus {
      border-color: #8b5cf6;
      box-shadow: 0 0 0 3px rgba(139, 92, 246, .1);
    }

    .form-field small {
      color: #94a3b8;
      font-size: 12px;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
    }


    /* =========================================================
       Toolbar
       ========================================================= */

    .toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
      margin-bottom: 18px;
    }

    .toolbar-left,
    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .search-box {
      position: relative;
      display: flex;
      align-items: center;
      width: min(420px, 45vw);
    }

    .search-box input {
      width: 100%;
      height: 40px;
      box-sizing: border-box;
      border: 1px solid #dbe3ee;
      border-radius: 10px;
      background: #fff;
      color: #0f172a;
      padding: 0 38px;
      font-size: 14px;
      outline: none;
      transition:
        border-color .18s ease,
        box-shadow .18s ease;
    }

    .search-box input:focus {
      border-color: #8b5cf6;
      box-shadow: 0 0 0 3px rgba(139, 92, 246, .08);
    }

    .search-icon {
      position: absolute;
      left: 13px;
      z-index: 1;
      color: #94a3b8;
      font-size: 20px;
      pointer-events: none;
    }

    .clear-search {
      position: absolute;
      right: 8px;
      width: 26px;
      height: 26px;
      border: 0;
      border-radius: 7px;
      background: #f1f5f9;
      color: #64748b;
      cursor: pointer;
    }

    .project-count {
      color: #64748b;
      font-size: 13px;
      font-weight: 600;
      white-space: nowrap;
    }


    /* =========================================================
       Project grid
       ========================================================= */

    .project-grid {
      display: grid;
      grid-template-columns:
        repeat(
          auto-fill,
          minmax(310px, 1fr)
        );
      gap: 18px;
      align-items: stretch;
    }

    .project-card-wrapper {
      min-width: 0;
    }


    /* =========================================================
       Empty state
       ========================================================= */

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 340px;
      padding: 40px;
      border: 1px dashed #d7dee8;
      border-radius: 16px;
      background: rgba(255,255,255,.7);
      text-align: center;
    }

    .empty-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 58px;
      height: 58px;
      margin-bottom: 15px;
      border-radius: 15px;
      background: #f1f5f9;
      color: #64748b;
      font-size: 30px;
    }

    .empty-state h2 {
      margin: 0;
      color: #0f172a;
      font-size: 20px;
    }

    .empty-state p {
      max-width: 450px;
      margin: 8px 0 20px;
      color: #64748b;
      line-height: 1.6;
      font-size: 14px;
    }


    /* =========================================================
       Skeleton
       ========================================================= */

    .project-skeleton {
      min-height: 250px;
      box-sizing: border-box;
      padding: 21px;
      border: 1px solid #e2e8f0;
      border-radius: 15px;
      background: #fff;
    }

    .skeleton {
      position: relative;
      overflow: hidden;
      border-radius: 7px;
      background: #edf1f5;
    }

    .skeleton::after {
      content: '';
      position: absolute;
      inset: 0;
      transform: translateX(-100%);
      background:
        linear-gradient(
          90deg,
          transparent,
          rgba(255,255,255,.75),
          transparent
        );
      animation: skeleton-loading 1.4s infinite;
    }

    .skeleton-title {
      width: 55%;
      height: 22px;
      margin-bottom: 18px;
    }

    .skeleton-line {
      width: 100%;
      height: 11px;
      margin-bottom: 9px;
    }

    .skeleton-line.short {
      width: 72%;
    }

    .skeleton-row {
      display: flex;
      justify-content: space-between;
      margin-top: 28px;
      margin-bottom: 18px;
    }

    .skeleton-small {
      width: 80px;
      height: 11px;
    }

    .skeleton-progress {
      width: 100%;
      height: 8px;
    }

    @keyframes skeleton-loading {
      100% {
        transform: translateX(100%);
      }
    }


    /* =========================================================
       Spinner
       ========================================================= */

    .spinner {
      width: 15px;
      height: 15px;
      border: 2px solid rgba(255,255,255,.4);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin .7s linear infinite;
    }

    .spinner.small {
      width: 13px;
      height: 13px;
      border-width: 2px;
      border-color: #cbd5e1;
      border-top-color: #64748b;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }


    /* =========================================================
       Responsive
       ========================================================= */

    @media (max-width: 900px) {

      .projects-page {
        padding: 22px 20px 40px;
      }

      .title-row {
        align-items: flex-start;
      }

      .form-grid {
        grid-template-columns: 1fr;
      }

      .project-grid {
        grid-template-columns:
          repeat(
            auto-fill,
            minmax(280px, 1fr)
          );
      }

    }


    @media (max-width: 640px) {

      .projects-page {
        padding: 18px 14px 32px;
      }

      h1 {
        font-size: 27px;
      }

      .title-row {
        flex-direction: column;
      }

      .title-row .primary-button {
        width: 100%;
      }

      .toolbar {
        align-items: stretch;
        flex-direction: column;
      }

      .toolbar-left,
      .toolbar-right {
        width: 100%;
      }

      .search-box {
        width: 100%;
      }

      .toolbar-right {
        justify-content: space-between;
      }

      .project-grid {
        grid-template-columns: 1fr;
      }

      .create-panel-header {
        align-items: flex-start;
      }

      .form-actions {
        flex-direction: column-reverse;
      }

      .form-actions button {
        width: 100%;
      }

    }

  `,
  ],
})
export class ProjectsPage {

  private readonly store = inject(Store);

  private readonly projectService =
    inject(ProjectService);

  private readonly router =
    inject(Router);


  /* =========================================================
     State
     ========================================================= */

  protected creating = false;

  protected creatingProject = false;

  protected searchTerm = '';


  protected newProject: {
    name: string;
    key: string;
    description?: string;
  } = {
    name: '',
    key: '',
    description: '',
  };


  protected readonly skeletonItems = [
    1,
    2,
    3,
    4,
    5,
    6,
  ];


  /* =========================================================
     Store
     ========================================================= */

  protected readonly projects$ =
    this.store.select(selectProjects);

  protected readonly loading$ =
    this.store.select(selectProjectsLoading);


  /* =========================================================
     Constructor
     ========================================================= */

  constructor() {

    this.store.dispatch(
      loadProjects()
    );

  }


  /* =========================================================
     Create project
     ========================================================= */

  protected toggleCreateForm(): void {

    this.creating = !this.creating;

  }


  protected cancelCreate(): void {

    this.creating = false;

    this.creatingProject = false;

    this.newProject = {
      name: '',
      key: '',
      description: '',
    };

  }


  protected normalizeProjectKey(): void {

    this.newProject.key =
      this.newProject.key
        .toUpperCase()
        .replace(/[^A-Z0-9_-]/g, '');

  }


  protected createProject(): void {

    if (
      !this.newProject.name.trim() ||
      !this.newProject.key.trim()
    ) {
      return;
    }


    this.creatingProject = true;


    const payload = {
      name: this.newProject.name.trim(),

      key: this.newProject.key
        .trim()
        .toUpperCase(),

      description:
        this.newProject.description?.trim() || '',
    };


    this.projectService
      .createProject(payload)
      .subscribe({

        next: (project) => {

          this.creatingProject = false;

          this.creating = false;

          this.newProject = {
            name: '',
            key: '',
            description: '',
          };


          this.store.dispatch(
            loadProjects()
          );


          this.router.navigate([
            '/projects',
            project.id,
          ]);

        },

        error: (error) => {

          this.creatingProject = false;

          console.error(
            'Unable to create project',
            error
          );

        },

      });

  }


  /* =========================================================
     Search
     ========================================================= */

  protected filteredProjects(
    projects: Project[]
  ): Project[] {

    const query =
      this.searchTerm
        .trim()
        .toLowerCase();


    if (!query) {

      return projects;

    }


    return projects.filter(
      (project) => {

        return [

          project.name,

          project.key,

          project.description,

          project.owner,

        ]
          .filter(Boolean)
          .some((value) =>
            String(value)
              .toLowerCase()
              .includes(query)
          );

      }
    );

  }


  /* =========================================================
     Refresh
     ========================================================= */

  protected refreshProjects(): void {

    this.store.dispatch(
      loadProjects()
    );

  }

}