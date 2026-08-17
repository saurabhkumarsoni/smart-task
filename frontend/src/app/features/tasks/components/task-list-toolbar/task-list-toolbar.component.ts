import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Member } from '../../../../core/models/app-models';
import { TaskListFilters } from '../../models/task-list.models';

@Component({
  selector: 'app-task-list-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-list-toolbar.component.html',
  styleUrl: './task-list-toolbar.component.scss',
})
export class TaskListToolbarComponent {
  @Input({ required: true }) filters!: TaskListFilters;
  @Input() members: Member[] = [];
  @Input() activeFilterCount = 0;
  @Input() loading = false;

  @Output() searchChange = new EventEmitter<string>();
  @Output() filtersChange = new EventEmitter<void>();
  @Output() clear = new EventEmitter<void>();

  protected filtersOpen = false;

  protected toggleFilters(): void {
    this.filtersOpen = !this.filtersOpen;
  }

  protected onSearch(value: string): void {
    this.filters.search = value;
    this.searchChange.emit(value);
  }

  protected emitChange(): void {
    this.filtersChange.emit();
  }

  protected clearAll(): void {
    this.filtersOpen = false;
    this.clear.emit();
  }
}
