import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-board-header',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './board-header.component.html',
  styleUrl: './board-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardHeaderComponent {
  @Input({ required: true })
  projectId!: string;

  @Input()
  searchTerm = '';

  @Input()
  selectedPriority = 'ALL';

  @Output()
  searchChange = new EventEmitter<string>();

  @Output()
  priorityChange = new EventEmitter<string>();

  protected updateSearch(value: string): void {
    this.searchChange.emit(value);
  }

  protected updatePriority(value: string): void {
    this.priorityChange.emit(value);
  }
}
