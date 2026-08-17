import { Member, Task } from '../../../core/models/app-models';

export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface TaskListFilters {
  search: string;
  status: string;
  priority: string;
  assignee_id: string;
  due_before: string;
  due_after: string;
}

export interface TaskDraft {
  title: string;
  description: string;
  priority: TaskPriority;
  assignee_id: string;
  due_date: string;
}

export interface TaskStatusChangeEvent {
  task: Task;
  status: string;
}

export interface TaskPriorityChangeEvent {
  task: Task;
  priority: string;
}

export interface TaskListMembers {
  members: Member[];
}
