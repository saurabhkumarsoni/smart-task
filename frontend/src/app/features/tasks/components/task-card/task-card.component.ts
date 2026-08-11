import { Component, Input } from '@angular/core';
import { Task } from '../../../../core/models/app-models';
import { PriorityChipComponent } from '../../../../shared/components/priority-chip/priority-chip';
import { StatusChipComponent } from '../../../../shared/components/status-chip/status-chip';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [PriorityChipComponent, StatusChipComponent],
  template: `
    <article class="task-card">
      <strong>{{ task.title }}</strong>
      <p>{{ task.description }}</p>

      <div class="meta">
        <app-status-chip [status]="normalizedStatus()" />
        <app-priority-chip [priority]="(task.priority || 'LOW').toUpperCase()" />
      </div>
    </article>
  `,
  styles: [
    `
      .task-card {
        border: 1px solid #dbe5f1;
        border-radius: 10px;
        padding: 10px;
      }
      p {
        margin: 6px 0 0;
        color: #64748b;
        font-size: 0.82rem;
      }

      .meta {
        margin-top: 10px;
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
    `,
  ],
})
export class TaskCardComponent {
  @Input({ required: true }) task!: Task;

  protected normalizedStatus(): string {
    return (this.task.status || 'TODO').replaceAll(' ', '_').toUpperCase();
  }
}
