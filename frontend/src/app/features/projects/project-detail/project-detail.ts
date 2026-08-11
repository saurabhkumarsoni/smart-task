import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ProjectService } from '../../../core/services/project.service';
import { Project } from '../../../core/models/app-models';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-card" *ngIf="project">
      <h2>{{ project.name }}</h2>
      <p>{{ project.description }}</p>
      <div class="tabs">
        <span>Overview</span>
        <span>Tasks</span>
        <span>Members</span>
        <span>Sprints</span>
        <span>Analytics</span>
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
      .tabs {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        margin-top: 16px;
      }
    `,
    `
      .tabs span {
        background: rgba(255, 255, 255, 0.08);
        padding: 8px 10px;
        border-radius: 999px;
      }
    `,
  ],
})
export class ProjectDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly projectService = inject(ProjectService);
  protected project: Project | null = null;

  ngOnInit(): void {
    const projectId = this.route.snapshot.paramMap.get('id') ?? '';
    this.projectService.getProject(projectId).subscribe((project) => (this.project = project));
  }
}
