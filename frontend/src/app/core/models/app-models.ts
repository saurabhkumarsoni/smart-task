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
  description: string;
  owner?: string;
  members?: number;
  progress?: number;
  tasksCount?: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignee?: string;
  projectId?: string;
}

export interface Organization {
  id: string;
  name: string;
  description?: string;
  members?: number;
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
