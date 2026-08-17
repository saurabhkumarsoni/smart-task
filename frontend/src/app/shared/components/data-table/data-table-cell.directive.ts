import { Directive, Input, TemplateRef } from '@angular/core';

export interface DataTableCellContext<T> {
  /**
   * The complete row.
   */
  $implicit: T;

  /**
   * Explicit row reference.
   */
  row: T;

  /**
   * Current cell value.
   */
  value: unknown;

  /**
   * Current row index.
   */
  index: number;
}

@Directive({
  selector: '[dataTableCell]',
  standalone: true,
})
export class DataTableCellDirective<T = unknown> {
  @Input('dataTableCell')
  key = '';

  constructor(public readonly template: TemplateRef<DataTableCellContext<T>>) {}
}
