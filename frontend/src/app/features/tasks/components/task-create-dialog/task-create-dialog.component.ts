import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Member } from '../../../../core/models/app-models';
import { TaskDraft } from '../../models/task-list.models';

@Component({
  selector: 'app-task-create-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-create-dialog.component.html',
  styleUrl: './task-create-dialog.component.scss',
})
export class TaskCreateDialogComponent {
  @Input() members: Member[] = [];
  @Input() saving = false;
  @Output() closed = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<TaskDraft>();

  protected draft: TaskDraft = this.emptyDraft();

  protected submit(): void {
    if (!this.draft.title.trim() || this.saving) return;
    this.submitted.emit({ ...this.draft, title: this.draft.title.trim() });
  }

  protected close(): void {
    if (!this.saving) this.closed.emit();
  }

  protected reset(): void {
    this.draft = this.emptyDraft();
  }

  private emptyDraft(): TaskDraft {
    return { title: '', description: '', priority: 'medium', assignee_id: '', due_date: '' };
  }
}
