import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

import { FormsModule } from '@angular/forms';

export interface OrganizationFormValue {
  id?: string;

  name: string;

  slug: string;

  description: string;
}

@Component({
  selector: 'app-organization-form',

  standalone: true,

  imports: [
    FormsModule,
  ],

  templateUrl:
    './organization-form.component.html',

  styleUrl:
    './organization-form.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class OrganizationFormComponent {
  @Input()
  form:
    | OrganizationFormValue
    | null = null;

  @Input()
  saving = false;

  @Output()
  saveForm =
    new EventEmitter<OrganizationFormValue>();

  @Output()
  close =
    new EventEmitter<void>();

  protected submit(): void {
    if (!this.form) {
      return;
    }

    const name =
      this.form.name.trim();

    const slug =
      this.form.slug.trim();

    const description =
      this.form.description.trim();

    if (!name) {
      return;
    }

    this.saveForm.emit({
      ...this.form,

      name,

      slug,

      description,
    });
  }

  protected onBackdropClick(): void {
    if (!this.saving) {
      this.close.emit();
    }
  }
}