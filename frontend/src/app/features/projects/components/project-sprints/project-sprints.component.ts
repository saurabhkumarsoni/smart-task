import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Sprint } from '../../../../core/models/app-models';

@Component({
  selector: 'app-project-sprints',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './project-sprints.component.html',
  styleUrl: './project-sprints.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectSprintsComponent {
  @Input() sprints: Sprint[] = [];
  @Input() loading = false;
  @Input() saving = false;

  @Output() createSprint = new EventEmitter<Partial<Sprint>>();
  @Output() toggleSprint = new EventEmitter<Sprint>();
  @Output() refresh = new EventEmitter<void>();

  protected draft: Partial<Sprint> = { name: '', goal: '', start_date: null, end_date: null };

  protected submit(): void {
    const name = String(this.draft.name ?? '').trim();
    if (!name || this.saving) return;
    this.createSprint.emit({
      name,
      goal: String(this.draft.goal ?? '').trim() || null,
      start_date: this.draft.start_date || null,
      end_date: this.draft.end_date || null,
    });
  }

  protected reset(): void {
    this.draft = { name: '', goal: '', start_date: null, end_date: null };
  }
}
