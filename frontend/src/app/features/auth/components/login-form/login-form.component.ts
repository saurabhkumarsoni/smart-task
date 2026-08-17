import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  @Output() readonly loginSuccess = new EventEmitter<void>();

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected readonly loading = this.fb.nonNullable.control(false);
  protected showPassword = false;
  protected errorMessage = '';

  protected submit(): void {
    this.errorMessage = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const values = this.form.getRawValue();
    this.loading.setValue(true);

    this.authService.login(values).subscribe({
      next: () => {
        this.loading.setValue(false);
        this.loginSuccess.emit();
      },
      error: (error: HttpErrorResponse) => {
        this.loading.setValue(false);
        this.errorMessage = this.readError(error);
      },
    });
  }

  protected togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  private readError(error: HttpErrorResponse): string {
    const detail = error.error?.detail;
    if (typeof detail === 'string') return detail;
    if (error.status === 401) return 'Invalid email or password.';
    if (error.status === 403) return 'Your account is currently inactive.';
    return 'Unable to sign in right now. Please try again.';
  }
}
