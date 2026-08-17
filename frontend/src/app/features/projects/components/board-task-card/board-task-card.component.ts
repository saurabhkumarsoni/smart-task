import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { Task } from '../../../../core/models/app-models';

@Component({
  selector: 'app-board-task-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './board-task-card.component.html',
  styleUrl: './board-task-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardTaskCardComponent {
  @Input({ required: true })
  task!: Task;

  protected priorityClass(): string {
    return String(this.task.priority || 'MEDIUM')
      .toLowerCase()
      .replaceAll(' ', '-');
  }

  protected assigneeLabel(): string {
    const value = this.task.assignee?.name?.trim() || this.task.assignee_id;
    if (!value || value === this.task.assignee_id) return 'Unassigned';
    return value;
  }

  protected initials(): string {
    const name = this.task.assignee?.name?.trim();

    if (!name) {
      return '?';
    }

    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }

  protected isOverdue(): boolean {
    if (!this.task.due_date || this.task.status === 'DONE') {
      return false;
    }

    return new Date(this.task.due_date).getTime() < Date.now();
  }
}
