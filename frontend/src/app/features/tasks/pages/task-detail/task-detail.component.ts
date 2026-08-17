import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Comment, Member, Sprint, Task, TaskHistory } from '../../../../core/models/app-models';
import { CollaborationService } from '../../../../core/services/collaboration.service';
import { ProjectMemberService } from '../../../../core/services/project-member.service';
import { SprintService } from '../../../../core/services/sprint.service';
import { TaskAttachment, TaskService } from '../../../../core/services/task.service';
import { environment } from '../../../../../environments/environment';

interface TaskDraft {
  description: string;
  status: string;
  priority: string;
  assignee_id: string;
  sprint_id: string;
  due_date: string;
}

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './task-detail.component.html',
  styleUrl: './task-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly tasks = inject(TaskService);
  private readonly collaboration = inject(CollaborationService);
  private readonly memberService = inject(ProjectMemberService);
  private readonly sprintService = inject(SprintService);

  protected projectId = '';
  protected taskId = '';

  protected readonly task = signal<Task | null>(null);
  protected readonly comments = signal<Comment[]>([]);
  protected readonly history = signal<TaskHistory[]>([]);
  protected readonly members = signal<Member[]>([]);
  protected readonly sprints = signal<Sprint[]>([]);
  protected readonly attachments = signal<TaskAttachment[]>([]);

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly uploading = signal(false);
  protected readonly deletingAttachmentId = signal<string | null>(null);
  protected readonly editingCommentId = signal<string | null>(null);
  protected readonly commentSaving = signal(false);
  protected readonly deletingCommentId = signal<string | null>(null);
  protected readonly errorMessage = signal('');
  protected readonly saveMessage = signal('');

  protected commentText = '';
  protected editCommentText = '';
  protected draft: TaskDraft = this.emptyDraft();

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('id') ?? '';
    this.taskId = this.route.snapshot.paramMap.get('taskId') ?? '';

    if (!this.projectId || !this.taskId) {
      this.errorMessage.set('The task could not be identified.');
      this.loading.set(false);
      return;
    }

    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.saveMessage.set('');

    this.tasks.getTaskDetail(this.projectId, this.taskId).subscribe({
      next: (response) => {
        this.setTask(response.task);
        this.comments.set(response.comments ?? []);
        this.attachments.set(response.attachments ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.tasks.getTask(this.projectId, this.taskId).subscribe({
          next: (task) => {
            this.setTask(task);
            this.loading.set(false);
            this.loadComments();
            this.loadAttachments();
          },
          error: () => {
            this.errorMessage.set('We could not load this task. Please try again.');
            this.loading.set(false);
          },
        });
      },
    });

    this.loadMembers();
    this.loadSprints();
    this.loadHistory();
  }

  private setTask(task: Task): void {
    this.task.set(task);
    this.draft = {
      description: task.description ?? '',
      status: task.status ?? 'todo',
      priority: task.priority ?? 'medium',
      assignee_id: task.assignee_id ?? '',
      sprint_id: task.sprint_id ?? '',
      due_date: task.due_date ?? '',
    };
  }

  protected loadMembers(): void {
    this.memberService.members(this.projectId).subscribe({
      next: (members) => this.members.set(members),
    });
  }

  protected loadSprints(): void {
    this.sprintService.list(this.projectId).subscribe({
      next: (sprints) => this.sprints.set(sprints),
    });
  }

  protected loadComments(): void {
    this.collaboration.comments(this.projectId, this.taskId).subscribe({
      next: (comments) => this.comments.set(comments),
    });
  }

  protected loadAttachments(): void {
    this.tasks.getAttachments(this.projectId, this.taskId).subscribe({
      next: (attachments) => this.attachments.set(attachments),
    });
  }

  protected loadHistory(): void {
    this.collaboration.history(this.projectId, this.taskId).subscribe({
      next: (history) => this.history.set(history),
    });
  }

  protected save(): void {
    if (this.saving() || !this.task()) return;

    this.saving.set(true);
    this.saveMessage.set('');

    this.tasks
      .updateTask(this.projectId, this.taskId, {
        description: this.draft.description.trim() || undefined,
        status: this.draft.status,
        priority: this.draft.priority,
        assignee_id: this.draft.assignee_id || undefined,
        sprint_id: this.draft.sprint_id || undefined,
        due_date: this.draft.due_date || undefined,
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (task) => {
          this.setTask(task);
          this.saveMessage.set('Task updated successfully.');
          this.loadHistory();
        },
        error: () => {
          this.errorMessage.set('Unable to save the task. Please try again.');
        },
      });
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      this.errorMessage.set('Attachments must be 10 MB or smaller.');
      input.value = '';
      return;
    }

    this.errorMessage.set('');
    this.uploading.set(true);

    this.tasks.uploadAttachment(this.projectId, this.taskId, file)
      .pipe(finalize(() => {
        this.uploading.set(false);
        input.value = '';
      }))
      .subscribe({
        next: (attachment) => this.attachments.update((items) => [attachment, ...items]),
        error: () => this.errorMessage.set('The attachment could not be uploaded.'),
      });
  }

  protected getFileIcon(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext ?? '')) return 'bi-file-earmark-image';
    if (ext === 'pdf') return 'bi-file-earmark-pdf';
    if (['doc', 'docx'].includes(ext ?? '')) return 'bi-file-earmark-word';
    if (['xls', 'xlsx'].includes(ext ?? '')) return 'bi-file-earmark-spreadsheet';
    if (['zip', 'rar', '7z'].includes(ext ?? '')) return 'bi-file-earmark-zip';
    return 'bi-paperclip';
  }

  protected formatFileSize(bytes?: number): string {
    if (bytes == null) return 'Size unavailable';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  protected getDownloadUrl(attachment: TaskAttachment): string {
    return `${environment.apiBaseUrl}/projects/${this.projectId}/tasks/${this.taskId}/attachments/${attachment.id}/download`;
  }

  protected deleteAttachment(attachmentId: string): void {
    if (this.deletingAttachmentId()) return;
    if (!window.confirm('Delete this attachment? This action cannot be undone.')) return;

    this.deletingAttachmentId.set(attachmentId);
    this.tasks.deleteAttachment(this.projectId, this.taskId, attachmentId)
      .pipe(finalize(() => this.deletingAttachmentId.set(null)))
      .subscribe({
        next: () => this.attachments.update((items) => items.filter((item) => item.id !== attachmentId)),
        error: () => this.errorMessage.set('The attachment could not be deleted.'),
      });
  }

  protected addComment(): void {
    const content = this.commentText.trim();
    if (!content || this.commentSaving()) return;

    this.commentSaving.set(true);
    this.collaboration.addComment(this.projectId, this.taskId, content)
      .pipe(finalize(() => this.commentSaving.set(false)))
      .subscribe({
        next: (comment) => {
          this.commentText = '';
          this.comments.update((items) => [...items, comment]);
          this.loadHistory();
        },
        error: () => this.errorMessage.set('Your comment could not be added.'),
      });
  }

  protected startCommentEdit(comment: Comment): void {
    this.editingCommentId.set(comment.id);
    this.editCommentText = comment.content;
  }

  protected saveCommentEdit(comment: Comment): void {
    const content = this.editCommentText.trim();
    if (!content || this.commentSaving()) return;

    this.commentSaving.set(true);
    this.collaboration.updateComment(this.projectId, this.taskId, comment.id, content)
      .pipe(finalize(() => this.commentSaving.set(false)))
      .subscribe({
        next: (updated) => {
          this.comments.update((items) => items.map((item) => item.id === updated.id ? updated : item));
          this.cancelCommentEdit();
        },
        error: () => this.errorMessage.set('The comment could not be updated.'),
      });
  }

  protected cancelCommentEdit(): void {
    this.editingCommentId.set(null);
    this.editCommentText = '';
  }

  protected deleteComment(commentId: string): void {
    if (this.deletingCommentId()) return;
    if (!window.confirm('Delete this comment?')) return;

    this.deletingCommentId.set(commentId);
    this.collaboration.deleteComment(this.projectId, this.taskId, commentId)
      .pipe(finalize(() => this.deletingCommentId.set(null)))
      .subscribe({
        next: () => this.comments.update((items) => items.filter((item) => item.id !== commentId)),
        error: () => this.errorMessage.set('The comment could not be deleted.'),
      });
  }

  protected memberName(userId?: string | null): string {
    if (!userId) return 'Unassigned';
    const member = this.members().find((item) => item.user_id === userId);
    if (!member) return 'Team member';
    return member.user?.first_name || member.user?.last_name
      ? `${member.user?.first_name ?? ''} ${member.user?.last_name ?? ''}`.trim()
      : member.user?.username || member.user_name || member.user_email || 'Team member';
  }

  protected memberInitials(userId?: string | null): string {
    const name = this.memberName(userId);
    if (name === 'Unassigned' || name === 'Team member') return '?';
    return name.split(/\s+/).slice(0, 2).map((part) => part.charAt(0)).join('').toUpperCase();
  }

  protected historyActor(entry: TaskHistory): string {
    return entry.changed_by_name || 'A team member';
  }

  protected statusLabel(status: string): string {
    return ({ todo: 'To do', in_progress: 'In progress', in_review: 'In review', done: 'Done' } as Record<string, string>)[status] ?? status;
  }

  protected priorityLabel(priority: string): string {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  }

  protected sprintName(sprintId?: string | null): string {
    if (!sprintId) return 'No sprint';
    return this.sprints().find((sprint) => sprint.id === sprintId)?.name ?? 'No sprint';
  }

  protected isOverdue(): boolean {
    const dueDate = this.task()?.due_date;
    if (!dueDate || this.task()?.status === 'done') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(`${dueDate}T00:00:00`) < today;
  }

  private emptyDraft(): TaskDraft {
    return {
      description: '',
      status: 'todo',
      priority: 'medium',
      assignee_id: '',
      sprint_id: '',
      due_date: '',
    };
  }
}
