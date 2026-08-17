import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-password-field',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './password-field.component.html',
  styleUrl: './password-field.component.scss',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: PasswordFieldComponent, multi: true }],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordFieldComponent implements ControlValueAccessor {
  @Input({ required: true }) label = '';
  @Input() autocomplete = 'new-password';
  @Input() placeholder = 'Enter password';
  @Input() describedBy = '';

  protected value = '';
  protected disabled = false;
  protected visible = false;
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string | null): void { this.value = value ?? ''; }
  registerOnChange(fn: (value: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(disabled: boolean): void { this.disabled = disabled; }

  protected input(value: string): void { this.value = value; this.onChange(value); }
  protected blur(): void { this.onTouched(); }
  protected toggle(): void { this.visible = !this.visible; }
}
