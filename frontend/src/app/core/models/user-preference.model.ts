export interface UserPreferences {
  user_id: string;
  email_notifications: boolean;
  desktop_notifications: boolean;
  task_assignments: boolean;
  mentions: boolean;
  weekly_digest: boolean;
  compact_mode: boolean;
  updated_at: string;
}

export type UserPreferenceKey =
  | 'email_notifications'
  | 'desktop_notifications'
  | 'task_assignments'
  | 'mentions'
  | 'weekly_digest'
  | 'compact_mode';
