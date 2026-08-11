import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { Task } from '../../../../core/models/app-models';
import { TaskCardComponent } from '../task-card/task-card.component';

@Component({
  selector: 'app-task-status-column',
  standalone: true,
  imports: [CommonModule, DragDropModule, TaskCardComponent],
  template: `
    <section class="column">
      <header>
        <h4>{{ title }}</h4>
        <span>{{ tasks.length }}</span>
      </header>

      <div
        class="stack"
        cdkDropList
        [id]="dropListId"
        [cdkDropListData]="tasks"
        (cdkDropListDropped)="onDrop($event)"
      >
        <div class="draggable" *ngFor="let task of tasks" cdkDrag [cdkDragData]="task">
          <app-task-card [task]="task" />
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .column {
        background: rgba(15, 23, 42, 0.82);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        padding: 14px;
        min-height: 280px;
      }

      header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
      }

      h4 {
        margin: 0;
      }

      header span {
        font-size: 0.82rem;
        color: #94a3b8;
      }

      .stack {
        display: grid;
        gap: 10px;
      }

      .draggable {
        cursor: grab;
      }

      .draggable:active {
        cursor: grabbing;
      }
    `,
  ],
})
export class TaskStatusColumnComponent {
  @Input() title = 'TODO';
  @Input() tasks: Task[] = [];
  @Input() statusKey: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' = 'TODO';
  @Output() taskDropped = new EventEmitter<{
    task: Task;
    toStatus: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
  }>();

  protected get dropListId(): string {
    return `task-column-${this.statusKey}`;
  }

  protected onDrop(event: CdkDragDrop<Task[]>): void {
    if (event.previousContainer === event.container) {
      return;
    }

    const task = event.item.data as Task;
    this.taskDropped.emit({ task, toStatus: this.statusKey });
  }
}
