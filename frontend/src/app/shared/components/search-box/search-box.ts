import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-box',
  standalone: true,
  imports: [FormsModule],
  template: `
    <label class="search-box">
      <input
        type="search"
        [placeholder]="placeholder"
        [(ngModel)]="value"
        (ngModelChange)="valueChange.emit(value)"
      />
    </label>
  `,
  styles: [
    `
      .search-box input {
        width: 100%;
        border: 1px solid #dbe5f1;
        border-radius: 10px;
        padding: 10px 12px;
      }
    `,
  ],
})
export class SearchBoxComponent {
  @Input() placeholder = 'Search...';
  @Input() value = '';
  @Output() valueChange = new EventEmitter<string>();
}
