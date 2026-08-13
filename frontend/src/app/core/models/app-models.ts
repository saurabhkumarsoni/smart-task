export interface User {
  id: string;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
  is_verified?: boolean;
  role: string;
}

export interface Project {
  id: string;
  name: string;
  key?: string;
  description?: string | null;
  owner_id?: string;
  owner?: string;
  is_active?: boolean;
  members?: number;
  progress?: number;
  tasksCount?: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  assignee?: string;
  project_id?: string;
  assignee_id?: string | null;
  sprint_id?: string | null;
  due_date?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Organization {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;
  is_active?: boolean;
  created_at?: string;
}

export interface Member {
  id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  user_name?: string | null;
  user_email?: string | null;
  joined_at: string;
}

export interface Sprint {
  id: string;
  project_id: string;
  name: string;
  goal?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_active: boolean;
}

export interface Comment {
  id: string;
  task_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface TaskHistory {
  id: string;
  action: string;
  summary: string;
  previous_status?: string | null;
  new_status?: string | null;
  changed_by_name?: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface ProjectOverview {
  project_id: string;
  project_name: string;
  total_tasks: number;
  completed_tasks: number;
  active_tasks: number;
  member_count: number;
  summary: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface RegisterPayload {
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  password: string;
}

export interface ApiMessageResponse {
  message: string;
  reset_token?: string;
}
