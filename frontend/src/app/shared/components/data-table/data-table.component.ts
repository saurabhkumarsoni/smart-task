import {
  ChangeDetectionStrategy,
  Component,
  ContentChildren,
  EventEmitter,
  Input,
  Output,
  QueryList,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { DataTableCellContext, DataTableCellDirective } from './data-table-cell.directive';

export interface DataTableColumn<T = object> {
  /**
   * Property name used to identify the column.
   *
   * It can also be a virtual/custom column such as:
   * organization, members, actions, status, etc.
   */
  key: keyof T | string;

  /**
   * Header displayed to the user.
   */
  label: string;

  /**
   * Whether the column supports sorting.
   */
  sortable?: boolean;

  /**
   * Optional column width.
   */
  width?: string;

  /**
   * Horizontal alignment.
   */
  align?: 'left' | 'center' | 'right';

  /**
   * Hide column from the table.
   */
  hidden?: boolean;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTableComponent<T extends object> {
  /**
   * Table data.
   *
   * Example:
   *
   * Organization[]
   */
  @Input()
  rows: T[] = [];

  /**
   * Table column configuration.
   */
  @Input()
  columns: DataTableColumn<T>[] = [];

  /**
   * Loading state.
   */
  @Input()
  loading = false;

  /**
   * Whether rows can be selected/clicked.
   */
  @Input()
  selectable = false;

  /**
   * Currently selected row key.
   */
  @Input()
  selectedRowKey: string | number | null = null;

  /**
   * Property used as row identifier.
   */
  @Input()
  rowKey: keyof T | string = 'id';

  /**
   * Empty state title.
   */
  @Input()
  emptyTitle = 'No records found';

  /**
   * Empty state description.
   */
  @Input()
  emptyDescription = 'There are no records to display.';

  /**
   * Emits the complete typed row.
   *
   * For OrganizationTableComponent:
   *
   * EventEmitter<Organization>
   */
  @Output()
  rowClick = new EventEmitter<T>();

  /**
   * Emits sorting information.
   */
  @Output()
  sortChange = new EventEmitter<{
    key: string;
    direction: 'asc' | 'desc';
  }>();

  /**
   * Custom cell templates.
   */
  @ContentChildren(DataTableCellDirective)
  cellTemplates!: QueryList<DataTableCellDirective<T>>;

  /**
   * Current sort column.
   */
  protected sortKey = '';

  /**
   * Current sort direction.
   */
  protected sortDirection: 'asc' | 'desc' = 'asc';

  /**
   * Returns only visible columns.
   */
  protected visibleColumns(): DataTableColumn<T>[] {
    return this.columns.filter((column) => !column.hidden);
  }

  /**
   * Converts a column key to string.
   */
  protected getKey(key: keyof T | string): string {
    return String(key);
  }

  /**
   * Returns a value from a row.
   */
  protected getValue(row: T, key: keyof T | string): unknown {
    return (row as Record<string, unknown>)[String(key)];
  }

  /**
   * Finds custom template for a column.
   */
  protected getCellTemplate(key: string): DataTableCellDirective<T> | undefined {
    return this.cellTemplates?.find((template) => template.key === key);
  }

  /**
   * Handles sorting.
   */
  protected onSort(column: DataTableColumn<T>): void {
    if (!column.sortable) {
      return;
    }

    const key = this.getKey(column.key);

    if (this.sortKey === key) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = key;
      this.sortDirection = 'asc';
    }

    this.sortChange.emit({
      key,
      direction: this.sortDirection,
    });
  }

  /**
   * Handles row selection/click.
   */
  protected onRowClick(row: T): void {
    if (!this.selectable) {
      return;
    }

    this.rowClick.emit(row);
  }

  /**
   * Returns the unique row identifier.
   */
  protected getRowKey(row: T, index: number): string | number {
    const value = this.getValue(row, this.rowKey);

    if (typeof value === 'string' || typeof value === 'number') {
      return value;
    }

    return index;
  }

  /**
   * Creates the template context.
   */
  protected createCellContext(
    row: T,
    index: number,
    column: DataTableColumn<T>,
  ): DataTableCellContext<T> {
    return {
      $implicit: row,
      row,
      value: this.getValue(row, column.key),
      index,
    };
  }
}
