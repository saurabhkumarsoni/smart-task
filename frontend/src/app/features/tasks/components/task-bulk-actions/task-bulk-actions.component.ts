import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Member } from '../../../../core/models/app-models';

@Component({
  selector: 'app-task-bulk-actions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-bulk-actions.component.html',
  styleUrl: './task-bulk-actions.component.scss',
})
export class TaskBulkActionsComponent {
  @Input() count = 0;
  @Input() members: Member[] = [];
  @Input() busy = false;
  @Output() status = new EventEmitter<string>();
  @Output() assignee = new EventEmitter<string>();
  @Output() delete = new EventEmitter<void>();
  @Output() clear = new EventEmitter<void>();

  protected bulkStatus = '';
  protected bulkAssignee = '';

  protected applyStatus(): void { if (this.bulkStatus) this.status.emit(this.bulkStatus); }
  protected applyAssignee(): void { if (this.bulkAssignee) this.assignee.emit(this.bulkAssignee); }
}
