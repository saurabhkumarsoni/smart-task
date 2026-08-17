import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from '../../core/services/auth.service';
import { PreferencesService } from '../../core/services/preferences.service';
import { UserPreferenceKey, UserPreferences } from '../../core/models/user-preference.model';
import { User } from '../../core/models/app-models';

interface PreferenceState {
  emailNotifications: boolean;
  desktopNotifications: boolean;
  taskAssignments: boolean;
  mentions: boolean;
  weeklyDigest: boolean;
  compactMode: boolean;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class SettingsPage {
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly preferencesService = inject(PreferencesService);

  private readonly preferenceStorageKey = 'smart-task-preferences';
  private readonly avatarStorageKey = 'smart-task-avatar-version';

  protected readonly user = signal<User | null>(this.authService.currentUser());
  protected readonly loading = signal(true);
  protected readonly savingProfile = signal(false);
  protected readonly profileSaved = signal(false);
  protected readonly profileError = signal('');
  protected readonly checkingAdmin = signal(true);
  protected readonly isAdmin = signal(false);
  protected readonly adminActionMessage = signal('');
  protected readonly copiedUserId = signal(false);
  protected readonly avatarVersion = signal(this.readAvatarVersion());
  protected readonly activeSection = signal('profile');
  protected readonly savingPreferences = signal(false);
  protected readonly preferenceError = signal('');

  protected readonly profileForm = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    first_name: ['', [Validators.required, Validators.maxLength(100)]],
    last_name: ['', [Validators.required, Validators.maxLength(100)]],
  });

  protected readonly adminForm = this.fb.nonNullable.group({
    target_email: ['', [Validators.required, Validators.email]],
    is_active: [true],
  });

  protected readonly preferences = signal<PreferenceState>(this.readPreferences());

  constructor() {
    this.authService.syncCurrentUser().subscribe({
      next: (freshUser) => {
        if (freshUser) {
          this.user.set(freshUser);
          this.patchProfile(freshUser);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.preferencesService.get().subscribe({
      next: (preferences) => this.preferences.set(preferencesToState(preferences)),
      error: () =>
        this.preferenceError.set(
          'Preferences are currently unavailable; local defaults are being used.',
        ),
    });

    this.authService.adminCheck().subscribe({
      next: () => {
        this.isAdmin.set(true);
        this.checkingAdmin.set(false);
      },
      error: () => {
        this.isAdmin.set(false);
        this.checkingAdmin.set(false);
      },
    });
  }

  protected get fullName(): string {
    const value = this.user();
    if (!value) return 'Your profile';
    return `${value.first_name ?? ''} ${value.last_name ?? ''}`.trim() || value.username;
  }

  protected get initials(): string {
    const value = this.user();
    if (!value) return 'U';
    const first = value.first_name?.charAt(0) ?? value.username?.charAt(0) ?? 'U';
    const last = value.last_name?.charAt(0) ?? '';
    return `${first}${last}`.toUpperCase();
  }

  protected get avatarUrl(): string {
    const value = this.user();
    const seed = encodeURIComponent(`${value?.username ?? 'user'}-${this.avatarVersion()}`);
    return `https://api.dicebear.com/8.x/thumbs/svg?seed=${seed}`;
  }

  protected get roleLabel(): string {
    return this.user()?.role === 'ADMIN' ? 'Administrator' : 'Member';
  }

  protected get accountStatusLabel(): string {
    return this.user()?.is_active ? 'Active' : 'Inactive';
  }

  protected get verificationLabel(): string {
    return this.user()?.is_verified ? 'Verified' : 'Not verified';
  }

  protected get accountCreatedLabel(): string {
    return this.formatDate(this.user()?.created_at);
  }

  protected get profileUpdatedLabel(): string {
    return this.formatDate(this.user()?.updated_at);
  }

  protected selectSection(section: string): void {
    this.activeSection.set(section);
    document
      .getElementById(`settings-${section}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  protected saveProfile(): void {
    if (this.profileForm.invalid || this.savingProfile()) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.profileError.set('');
    this.profileSaved.set(false);
    this.savingProfile.set(true);

    this.authService.updateProfile(this.profileForm.getRawValue()).subscribe({
      next: (updatedUser) => {
        this.user.set(updatedUser);
        this.profileForm.markAsPristine();
        this.profileSaved.set(true);
        this.savingProfile.set(false);
        setTimeout(() => this.profileSaved.set(false), 3500);
      },
      error: (error: HttpErrorResponse) => {
        this.profileError.set(this.readApiError(error, 'Unable to update your profile.'));
        this.savingProfile.set(false);
      },
    });
  }

  protected resetProfile(): void {
    const value = this.user();
    if (!value) return;
    this.patchProfile(value);
    this.profileError.set('');
    this.profileSaved.set(false);
  }

  protected refreshAvatar(): void {
    const next = this.avatarVersion() + 1;
    this.avatarVersion.set(next);
    localStorage.setItem(this.avatarStorageKey, String(next));
  }

  protected togglePreference(key: keyof PreferenceState): void {
    const next = { ...this.preferences(), [key]: !this.preferences()[key] };
    this.preferences.set(next);
    this.preferenceError.set('');
    this.savingPreferences.set(true);
    const apiKey = stateToApiKey(key);
    this.preferencesService.update({ [apiKey]: next[key] }).subscribe({
      next: () => this.savingPreferences.set(false),
      error: () => {
        this.savingPreferences.set(false);
        this.preferenceError.set(
          'Could not save this preference. Your local setting remains active.',
        );
        localStorage.setItem(this.preferenceStorageKey, JSON.stringify(next));
      },
    });
  }

  protected resetPreferences(): void {
    const defaults = this.defaultPreferences();
    this.preferences.set(defaults);
    this.preferenceError.set('');
    this.savingPreferences.set(true);
    this.preferencesService
      .update({
        email_notifications: defaults.emailNotifications,
        desktop_notifications: defaults.desktopNotifications,
        task_assignments: defaults.taskAssignments,
        mentions: defaults.mentions,
        weekly_digest: defaults.weeklyDigest,
        compact_mode: defaults.compactMode,
      })
      .subscribe({
        next: () => this.savingPreferences.set(false),
        error: () => {
          this.savingPreferences.set(false);
          this.preferenceError.set(
            'Defaults were applied locally but could not be saved to the server.',
          );
        },
      });
    localStorage.setItem(this.preferenceStorageKey, JSON.stringify(defaults));
  }

  protected copyUserId(): void {
    const id = this.user()?.id;
    if (!id || !navigator.clipboard) return;

    navigator.clipboard.writeText(id).then(() => {
      this.copiedUserId.set(true);
      setTimeout(() => this.copiedUserId.set(false), 1800);
    });
  }

  protected submitActivation(): void {
    if (this.adminForm.invalid) {
      this.adminForm.markAllAsTouched();
      return;
    }

    const values = this.adminForm.getRawValue();
    this.authService.activateAccount(values.target_email, values.is_active).subscribe({
      next: (updatedUser) => {
        const statusText = updatedUser.is_active ? 'active' : 'inactive';
        this.adminActionMessage.set(`Updated ${updatedUser.email} to ${statusText}.`);
      },
      error: (error: HttpErrorResponse) => {
        this.adminActionMessage.set(this.readApiError(error, 'Unable to update the account.'));
      },
    });
  }

  protected trackByPreference(_: number, item: { key: keyof PreferenceState }): string {
    return item.key;
  }

  protected readonly preferenceItems: Array<{
    key: keyof PreferenceState;
    icon: string;
    title: string;
    description: string;
  }> = [
    {
      key: 'emailNotifications',
      icon: 'bi-envelope',
      title: 'Email notifications',
      description: 'Receive important account and workspace updates by email.',
    },
    {
      key: 'desktopNotifications',
      icon: 'bi-app-indicator',
      title: 'Desktop notifications',
      description: 'Show browser notifications for important activity.',
    },
    {
      key: 'taskAssignments',
      icon: 'bi-person-check',
      title: 'Task assignments',
      description: 'Notify me when a task is assigned or reassigned to me.',
    },
    {
      key: 'mentions',
      icon: 'bi-at',
      title: 'Mentions',
      description: 'Notify me when teammates mention me in a comment.',
    },
    {
      key: 'weeklyDigest',
      icon: 'bi-bar-chart',
      title: 'Weekly digest',
      description: 'Get a concise weekly summary of your workspace activity.',
    },
    {
      key: 'compactMode',
      icon: 'bi-layout-three-columns',
      title: 'Compact interface',
      description: 'Use denser spacing when working with large task lists.',
    },
  ];

  private patchProfile(user: User): void {
    this.profileForm.patchValue({
      username: user.username ?? '',
      first_name: user.first_name ?? '',
      last_name: user.last_name ?? '',
    });
    this.profileForm.markAsPristine();
  }

  private readPreferences(): PreferenceState {
    const defaults = this.defaultPreferences();
    try {
      const raw = localStorage.getItem(this.preferenceStorageKey);
      if (!raw) return defaults;
      return { ...defaults, ...(JSON.parse(raw) as Partial<PreferenceState>) };
    } catch {
      return defaults;
    }
  }

  private defaultPreferences(): PreferenceState {
    return {
      emailNotifications: true,
      desktopNotifications: true,
      taskAssignments: true,
      mentions: true,
      weeklyDigest: false,
      compactMode: false,
    };
  }

  private readAvatarVersion(): number {
    const value = Number(localStorage.getItem(this.avatarStorageKey) ?? '0');
    return Number.isFinite(value) ? value : 0;
  }

  private formatDate(value?: string): string {
    if (!value) return 'Not available';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Not available';
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }

  private readApiError(error: HttpErrorResponse, fallback: string): string {
    const detail = error.error?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail) && detail.length) {
      return (
        detail
          .map((item) => item?.msg)
          .filter(Boolean)
          .join(', ') || fallback
      );
    }
    return fallback;
  }
}

function preferencesToState(value: UserPreferences): PreferenceState {
  return {
    emailNotifications: value.email_notifications,
    desktopNotifications: value.desktop_notifications,
    taskAssignments: value.task_assignments,
    mentions: value.mentions,
    weeklyDigest: value.weekly_digest,
    compactMode: value.compact_mode,
  };
}

function stateToApiKey(key: keyof PreferenceState): UserPreferenceKey {
  return (
    {
      emailNotifications: 'email_notifications',
      desktopNotifications: 'desktop_notifications',
      taskAssignments: 'task_assignments',
      mentions: 'mentions',
      weeklyDigest: 'weekly_digest',
      compactMode: 'compact_mode',
    } as const
  )[key];
}
