// ============================================================
// Application Models
// ============================================================

/**
 * Application user.
 */
export interface User {
  id: string;
  email: string;
  username: string;

  first_name?: string | null;
  last_name?: string | null;

  is_active?: boolean;
  is_verified?: boolean;

  role: string;

  created_at?: string;
  updated_at?: string;
}

/**
 * Project model.
 */
export interface Project {
  id: string;

  name: string;

  key?: string | null;

  description?: string | null;

  owner_id?: string | null;

  owner?: string | null;
  owner_name?: string | null;

  is_active?: boolean;

  members?: number;
  member_count?: number;

  progress?: number;

  tasksCount?: number;
  task_count?: number;
  completed_task_count?: number;
}

export interface TaskAssignee {
  id: string;
  name: string;
  email?: string;
  avatar_url?: string | null;
}

/**
 * Task model.
 */
export interface Task {
  id: string;

  title: string;

  description?: string | null;

  status: string;

  priority: string;

  assignee?: TaskAssignee | null;

  project_id?: string | null;

  assignee_id?: string | null;

  sprint_id?: string | null;

  due_date?: string | null;

  created_at?: string;

  updated_at?: string;
}

/**
 * Organization model.
 *
 * Matches:
 *
 * GET /organizations
 * PUT /organizations/{organization_id}
 */
export interface Organization {
  id: string;

  name: string;

  slug: string;

  description?: string | null;

  is_active: boolean;

  created_at: string;

  updated_at: string;
}

/**
 * Supported organization roles.
 *
 * Matches backend OrganizationRole:
 *
 * owner
 * admin
 * member
 * viewer
 */
export type OrganizationRole = 'owner' | 'admin' | 'member' | 'viewer';

/**
 * User information returned inside an organization member.
 *
 * Backend response:
 *
 * {
 *   id: "...",
 *   username: "user29",
 *   email: "user29@smarttask.dev",
 *   first_name: "James",
 *   last_name: "Lamb",
 *   is_active: true,
 *   is_verified: true
 * }
 */
export interface OrganizationMemberUser {
  id: string;

  username: string;

  email: string;

  first_name?: string | null;

  last_name?: string | null;

  is_active?: boolean;

  is_verified?: boolean;
}

/**
 * Organization member.
 *
 * Current backend response:
 *
 * {
 *   id: "...",
 *   organization_id: "...",
 *   user_id: "...",
 *   role: "member",
 *   joined_at: "...",
 *   user: {
 *     id: "...",
 *     username: "...",
 *     email: "...",
 *     first_name: "...",
 *     last_name: "...",
 *     is_active: true,
 *     is_verified: true
 *   }
 * }
 *
 * The old user_name/user_email fields are kept as optional
 * compatibility fields because several existing components
 * still use them.
 */
export interface Member {
  /**
   * Organization membership record ID.
   */
  id: string;

  /**
   * Organization ID.
   */
  organization_id?: string;

  /**
   * User ID.
   */
  user_id: string;

  /**
   * Organization role.
   */
  role: OrganizationRole;

  /**
   * Date/time when the user joined the organization.
   */
  joined_at: string;

  /**
   * NEW API RESPONSE.
   *
   * User information is now returned as a nested object.
   */
  user?: OrganizationMemberUser | null;

  /**
   * Legacy compatibility fields.
   *
   * These are optional because the new API no longer returns
   * them directly.
   */
  user_name?: string | null;

  user_email?: string | null;

  first_name?: string | null;

  last_name?: string | null;

  username?: string | null;
}

/**
 * User information returned by project member APIs.
 */
export interface ProjectMemberUser {
  id: string;
  username: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  is_active?: boolean;
  is_verified?: boolean;
}

/**
 * Project member roles.
 *
 * Keep this separate from OrganizationRole so project
 * membership does not depend on organization membership.
 */
export type ProjectMemberRole = 'owner' | 'admin' | 'member' | 'viewer';

/**
 * Project member.
 *
 * Expected API shape:
 *
 * {
 *   id: "...",
 *   project_id: "...",
 *   user_id: "...",
 *   role: "member",
 *   joined_at: "...",
 *   user: {
 *     id: "...",
 *     username: "...",
 *     email: "...",
 *     first_name: "...",
 *     last_name: "...",
 *     is_active: true,
 *     is_verified: true
 *   }
 * }
 */
export interface ProjectMember {
  id: string;

  project_id: string;

  user_id: string;

  role: ProjectMemberRole;

  joined_at: string;

  user?: ProjectMemberUser | null;

  /**
   * Compatibility fields.
   *
   * These can be removed later after all old project/task
   * references have been migrated.
   */
  user_name?: string | null;

  user_email?: string | null;

  first_name?: string | null;

  last_name?: string | null;

  username?: string | null;
}

/**
 * Sprint model.
 */
export interface Sprint {
  id: string;

  project_id: string;

  name: string;

  goal?: string | null;

  start_date?: string | null;

  end_date?: string | null;

  is_active: boolean;
}

/**
 * Task comment.
 */
export interface Comment {
  id: string;

  task_id: string;

  author_id: string;

  content: string;

  created_at: string;

  updated_at: string;
}

/**
 * Task history entry.
 */
export interface TaskHistory {
  id: string;

  action: string;

  summary: string;

  previous_status?: string | null;

  new_status?: string | null;

  changed_by_name?: string | null;

  created_at: string;
}

/**
 * Notification.
 */
export interface Notification {
  id: string;

  user_id?: string;

  task_id?: string | null;

  title: string;

  message: string;

  is_read: boolean;

  created_at: string;
}

/**
 * Project overview.
 */
export interface ProjectOverview {
  project_id: string;

  project_name: string;

  total_tasks: number;

  completed_tasks: number;

  active_tasks: number;

  member_count: number;

  summary: string;
}

/**
 * Authentication response.
 */
export interface AuthResponse {
  access_token: string;

  refresh_token: string;

  token_type: string;

  user: User;
}

/**
 * Registration payload.
 */
export interface RegisterPayload {
  first_name: string;

  last_name: string;

  email: string;

  username: string;

  password: string;
}

/**
 * Generic API message response.
 */
export interface ApiMessageResponse {
  message: string;

  reset_token?: string;
}
