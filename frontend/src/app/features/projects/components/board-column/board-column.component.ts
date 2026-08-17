import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';

import { Task } from '../../../../core/models/app-models';
import { BoardColumnConfig, BoardStatus } from '../../pages/project-board/project-board.component';

import { BoardTaskCardComponent } from '../board-task-card/board-task-card.component';

@Component({
  selector: 'app-board-column',
  standalone: true,
  imports: [DragDropModule, BoardTaskCardComponent],
  templateUrl: './board-column.component.html',
  styleUrl: './board-column.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardColumnComponent {
  @Input({ required: true })
  column!: BoardColumnConfig;

  @Input()
  tasks: Task[] = [];

  @Output()
  taskDropped = new EventEmitter<{
    task: Task;
    toStatus: BoardStatus;
  }>();

  protected drop(event: CdkDragDrop<Task[]>): void {
    const task = event.item.data as Task | undefined;

    /*
     * Defensive guard.
     *
     * If Angular CDK somehow gives us a drag without data,
     * don't emit an invalid event to the parent.
     */
    if (!task?.id) {
      console.warn('[Board] Dropped item does not contain a valid task.', event);

      return;
    }

    /*
     * Ignore drops inside the same column.
     */
    const sourceStatus = this.normalizeStatus(task.status);

    if (sourceStatus === this.normalizeStatus(this.column.key)) {
      return;
    }

    this.taskDropped.emit({
      task,
      toStatus: this.column.key,
    });
  }

  protected trackTask(_: number, task: Task): string {
    return task.id;
  }

  private normalizeStatus(status?: string): string {
    return (status || 'TODO').replaceAll(' ', '_').toUpperCase();
  }
}
