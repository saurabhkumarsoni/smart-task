import { Task } from '../models/app-models';

type UnknownRecord = Record<string, unknown>;

function record(value: unknown): UnknownRecord {
  return value !== null && typeof value === 'object' ? (value as UnknownRecord) : {};
}

export function getTaskAssigneeName(task: Task): string {
  const taskValue = record(task);

  const directName = taskValue['assignee_name'];

  if (typeof directName === 'string' && directName.trim()) {
    return directName.trim();
  }

  const assignee = record(task.assignee);

  const name = assignee['name'];

  if (typeof name === 'string' && name.trim()) {
    return name.trim();
  }

  const firstName = assignee['first_name'];
  const lastName = assignee['last_name'];

  const fullName = [firstName, lastName]
    .filter((value): value is string => typeof value === 'string' && !!value.trim())
    .join(' ')
    .trim();

  if (fullName) {
    return fullName;
  }

  const email = assignee['email'];

  if (typeof email === 'string' && email.trim()) {
    return email.trim();
  }

  return task.assignee_id ? 'Assigned' : 'Unassigned';
}

export function getTaskAssigneeInitials(task: Task): string {
  const name = getTaskAssigneeName(task);

  if (!name || name === 'Assigned' || name === 'Unassigned') {
    return '—';
  }

  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}
