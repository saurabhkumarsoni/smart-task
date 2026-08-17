import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Task, Member } from '../../../../core/models/app-models';
import { TaskPriorityChangeEvent, TaskStatusChangeEvent } from '../../models/task-list.models';

@Component({
  selector: 'app-task-table',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './task-table.component.html',
  styleUrl: './task-table.component.scss',
})
export class TaskTableComponent {
  @Input() tasks: Task[] = [];
  @Input() members: Member[] = [];
  @Input() selectedIds: string[] = [];
  @Input() projectId = '';
  @Input() loading = false;

  @Output() select = new EventEmitter<string>();
  @Output() selectAll = new EventEmitter<void>();
  @Output() statusChange = new EventEmitter<TaskStatusChangeEvent>();
  @Output() priorityChange = new EventEmitter<TaskPriorityChangeEvent>();
  @Output() delete = new EventEmitter<Task>();

  protected isSelected(id: string): boolean {
    return this.selectedIds.includes(id);
  }
  protected allSelected(): boolean {
    return this.tasks.length > 0 && this.tasks.every((t) => this.isSelected(t.id));
  }
  protected assigneeName(id?: string | null): string {
    if (!id) return 'Unassigned';
    const m = this.members.find((x) => x.user_id === id);
    return m?.user?.first_name || m?.user?.last_name
      ? `${m.user?.first_name ?? ''} ${m.user?.last_name ?? ''}`.trim()
      : m?.user?.username || m?.user_name || m?.user_email || id.slice(0, 8);
  }
  protected initials(id?: string | null): string {
    const name = this.assigneeName(id);
    if (name === 'Unassigned') return '?';
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((x) => x[0])
      .join('')
      .toUpperCase();
  }
  protected statusLabel(status: string): string {
    return (
      (
        {
          todo: 'To do',
          in_progress: 'In progress',
          in_review: 'In review',
          done: 'Done',
        } as Record<string, string>
      )[status] ?? status
    );
  }
  protected priorityLabel(priority: string): string {
    return priority ? priority[0].toUpperCase() + priority.slice(1) : 'Medium';
  }
  protected dueLabel(date?: string | null): string {
    if (!date) return 'No due date';
    const d = new Date(`${date}T00:00:00`);
    return Number.isNaN(d.getTime())
      ? date
      : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
  protected dueClass(date?: string | null): string {
    if (!date) return '';
    const due = new Date(`${date}T23:59:59`).getTime();
    const now = Date.now();
    return due < now ? 'overdue' : due < now + 3 * 86400000 ? 'soon' : '';
  }
  protected statusChanged(task: Task, value: string): void {
    this.statusChange.emit({ task, status: value });
  }
  protected priorityChanged(task: Task, value: string): void {
    this.priorityChange.emit({ task, priority: value });
  }
}
