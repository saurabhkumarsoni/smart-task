export interface DashboardSummary {
  totalProjects: number;
  totalTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  todoTasks: number;
  completionRate: number;
  averageProgress: number;
}

export interface ProjectDashboard {
  project_id: string;
  project_name: string;
  total_tasks: number;
  todo_count: number;
  in_progress_count: number;
  done_count: number;
  in_review_count?: number;
  member_count?: number;
  active_sprints?: number;
  overdue_count: number;
  completion_rate: number;
  recent_activity: DashboardActivity[];
  status?: DashboardBreakdown[];
  priority?: DashboardBreakdown[];
  upcoming_deadlines?: ProjectDeadline[];
  team_performance?: TeamPerformance[];
}

export interface DashboardActivity {
  id: string;
  task_id: string;
  action: string;
  summary: string;
  created_at: string;
}

export interface WorkspaceDashboard {
  period: { start: string; end: string };
  metrics: {
    users: number;
    projects: number;
    tasks: number;
    completed: number;
    overdue: number;
    active_sprints: number;
    completion_rate: number;
  };
  status: DashboardBreakdown[];
  priority: DashboardBreakdown[];
  trend: { date: string; created: number; completed: number }[];
  projects: ProjectPerformance[];
  upcoming_deadlines: DashboardDeadline[];
  recent_activity: WorkspaceActivity[];
}

export interface DashboardBreakdown {
  name: string;
  count: number;
}
export interface ProjectPerformance {
  id: string;
  name: string;
  tasks: number;
  completed: number;
  overdue: number;
  progress: number;
}
export interface DashboardDeadline {
  id: string;
  title: string;
  due_date: string;
  project: string;
}
export interface WorkspaceActivity {
  id: string;
  title: string;
  summary: string;
  created_at: string;
}

export interface ProjectDeadline {
  id: string;
  title: string;
  due_date: string;
  status: string;
  priority: string;
}
export interface TeamPerformance {
  user_id: string;
  name: string;
  assigned: number;
  completed: number;
  progress: number;
}
