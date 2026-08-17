import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Project } from '../../../../core/models/app-models';

@Component({
  selector: 'app-project-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './project-settings.component.html',
  styleUrl: './project-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectSettingsComponent implements OnChanges {
  @Input() project: Project | null = null;
  @Input() saving = false;
  @Input() deleting = false;

  @Output() save = new EventEmitter<{ name: string; description: string | null; is_active: boolean }>();
  @Output() delete = new EventEmitter<void>();

  protected name = '';
  protected description = '';
  protected isActive = true;
  private initializedProjectId = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['project']) {
      this.syncProject(this.project);
    }
  }

  private syncProject(project: Project | null): void {
    if (!project || project.id === this.initializedProjectId) return;
    this.initializedProjectId = project.id;
    this.name = project.name;
    this.description = project.description ?? '';
    this.isActive = project.is_active !== false;
  }

  protected saveProject(): void {
    if (!this.name.trim() || this.saving) return;
    this.save.emit({
      name: this.name.trim(),
      description: this.description.trim() || null,
      is_active: this.isActive,
    });
  }
}
