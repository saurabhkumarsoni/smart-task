import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';

import { PasswordFieldComponent } from '../../components/password-field/password-field.component';
import { PasswordStrengthComponent } from '../../components/password-strength/password-strength.component';
import { SecurityInfoComponent } from '../../components/security-info/security-info.component';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-change-password-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, PasswordFieldComponent, PasswordStrengthComponent, SecurityInfoComponent],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangePasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  protected readonly form = this.fb.nonNullable.group({
    current_password: ['', Validators.required],
    new_password: ['', [Validators.required, Validators.minLength(8)]],
    confirm_password: ['', Validators.required],
  });
  protected loading = false;
  protected errorMessage = '';
  protected success = false;

  protected get passwordsMatch(): boolean {
    const { new_password, confirm_password } = this.form.getRawValue();
    return !confirm_password || new_password === confirm_password;
  }

  protected submit(): void {
    this.errorMessage = '';
    this.success = false;
    this.form.markAllAsTouched();
    if (this.form.invalid || !this.passwordsMatch) {
      if (!this.passwordsMatch) this.errorMessage = 'New password and confirmation do not match.';
      return;
    }

    const { current_password, new_password } = this.form.getRawValue();
    this.loading = true;
    this.auth.changePassword({ current_password, new_password }).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
        this.form.reset();
        this.toast.success('Your password has been updated successfully.');
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        this.errorMessage = this.readError(error);
      },
    });
  }

  private readError(error: HttpErrorResponse): string {
    const detail = error.error?.detail;
    if (typeof detail === 'string') return detail;
    if (error.status === 401) return 'Your current password is incorrect.';
    if (error.status === 400) return 'The new password cannot be the same as your current password.';
    if (error.status === 422) return 'Please check the password requirements and try again.';
    return 'We could not update your password. Please try again.';
  }
}
