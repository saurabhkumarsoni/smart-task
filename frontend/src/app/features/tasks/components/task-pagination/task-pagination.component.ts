import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-task-pagination',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-pagination.component.html',
  styleUrl: './task-pagination.component.scss',
})
export class TaskPaginationComponent {
  @Input() page = 1;
  @Input() totalPages = 1;
  @Input() totalCount = 0;
  @Input() pageSize = 20;
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  protected go(delta: number): void { const next = this.page + delta; if (next >= 1 && next <= this.totalPages) this.pageChange.emit(next); }
  protected sizeChanged(value: number): void { this.pageSizeChange.emit(Number(value)); }

  protected get startItem(): number {
    return this.totalCount === 0 ? 0 : ((this.page - 1) * this.pageSize) + 1;
  }

  protected get endItem(): number {
    return Math.min(this.page * this.pageSize, this.totalCount);
  }
}
