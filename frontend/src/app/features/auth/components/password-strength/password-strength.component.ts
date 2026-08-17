import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-password-strength',
  standalone: true,
  templateUrl: './password-strength.component.html',
  styleUrl: './password-strength.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordStrengthComponent {
  @Input() password = '';

  protected get score(): number {
    const value = this.password;
    if (!value) return 0;
    let score = 0;
    if (value.length >= 8) score++;
    if (/[a-z]/.test(value)) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/\d/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;
    return score;
  }

  protected get label(): string {
    return ['', 'Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'][this.score];
  }
}
