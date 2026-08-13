import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Comment, Task, TaskHistory, Member, Sprint } from '../../../../core/models/app-models';
import { CollaborationService } from '../../../../core/services/collaboration.service';
import { TaskService, TaskAttachment } from '../../../../core/services/task.service';
import { ProjectMemberService } from '../../../../core/services/project-member.service';
import { SprintService } from '../../../../core/services/sprint.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    @if (task()) {
      <section class="page-card">
        <a [routerLink]="['/projects', projectId, 'tasks']">← Tasks</a>
        <h2>{{ task()!.title }}</h2>

        <form class="form" (ngSubmit)="save()">
          <div class="form-row">
            <textarea
              [(ngModel)]="task()!.description"
              name="description"
              placeholder="Description"
              rows="4"
            ></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Status</label>
              <select [(ngModel)]="task()!.status" name="status">
                <option value="todo">Todo</option>
                <option value="in_progress">In Progress</option>
                <option value="in_review">In Review</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div class="form-group">
              <label>Priority</label>
              <select [(ngModel)]="task()!.priority" name="priority">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Assignee</label>
              <select [(ngModel)]="task()!.assignee_id" name="assignee_id">
                <option value="">Unassigned</option>
                @for (member of members(); track member.user_id) {
                  <option [value]="member.user_id">
                    {{ member.user_name || member.user_email || member.user_id }}
                  </option>
                }
              </select>
            </div>
            <div class="form-group">
              <label>Sprint</label>
              <select [(ngModel)]="task()!.sprint_id" name="sprint_id">
                <option value="">No Sprint</option>
                @for (sprint of sprints(); track sprint.id) {
                  <option [value]="sprint.id">{{ sprint.name }}</option>
                }
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Due Date</label>
              <input [(ngModel)]="task()!.due_date" name="due_date" type="date" />
            </div>
          </div>

          <button type="submit" class="btn-primary">Save Task</button>
        </form>

        <!-- Attachments Section -->
        <section class="section">
          <div class="section-header">
            <h3>Attachments</h3>
            <label class="file-upload-btn">
              <input type="file" (change)="onFileSelected($event)" hidden />
              Add Attachment
            </label>
          </div>
          @if (uploading()) {
            <div class="upload-progress">Uploading...</div>
          }
          @for (attachment of attachments(); track attachment.id) {
            <article class="attachment-item">
              <div class="attachment-info">
                <span class="attachment-icon">{{ getFileIcon(attachment.file_name) }}</span>
                <div>
                  <span class="attachment-name">{{ attachment.file_name }}</span>
                  <small class="attachment-meta"
                    >{{ formatFileSize(attachment.size_bytes) }} •
                    {{ attachment.created_at | date: 'medium' }}</small
                  >
                </div>
              </div>
              <div class="attachment-actions">
                <a [href]="getDownloadUrl(attachment)" target="_blank" class="btn-secondary"
                  >Download</a
                >
                <button (click)="deleteAttachment(attachment.id)" class="btn-danger">Delete</button>
              </div>
            </article>
          } @empty {
            <p class="empty-state">No attachments yet</p>
          }
        </section>

        <!-- Comments Section -->
        <section class="section">
          <h3>Comments</h3>
          <form (ngSubmit)="addComment()" class="comment-form">
            <textarea
              [(ngModel)]="commentText"
              name="comment"
              required
              placeholder="Write a comment..."
              rows="3"
            ></textarea>
            <button type="submit" class="btn-primary" [disabled]="!commentText.trim()">
              Add Comment
            </button>
          </form>
          @for (comment of comments(); track comment.id) {
            <article class="comment" [class.editing]="editingCommentId() === comment.id">
              @if (editingCommentId() === comment.id) {
                <form (ngSubmit)="saveCommentEdit(comment)">
                  <textarea
                    [(ngModel)]="editCommentText"
                    name="edit_comment"
                    required
                    rows="3"
                  ></textarea>
                  <div class="comment-actions">
                    <button type="submit" class="btn-primary">Save</button>
                    <button type="button" (click)="cancelCommentEdit()" class="btn-secondary">
                      Cancel
                    </button>
                  </div>
                </form>
              } @else {
                <p>{{ comment.content }}</p>
                <small>{{ comment.created_at | date: 'medium' }}</small>
                <div class="comment-actions">
                  <button (click)="startCommentEdit(comment)" class="btn-text">Edit</button>
                  <button (click)="deleteComment(comment.id)" class="btn-text btn-danger">
                    Delete
                  </button>
                </div>
              }
            </article>
          } @empty {
            <p class="empty-state">No comments yet</p>
          }
        </section>

        <!-- History Section -->
        <section class="section">
          <h3>History</h3>
          @for (entry of history(); track entry.id) {
            <article class="history-entry">
              <b>{{ entry.summary }}</b>
              <small>{{ entry.created_at | date: 'medium' }}</small>
            </article>
          } @empty {
            <p class="empty-state">No history entries</p>
          }
        </section>
      </section>
    }
  `,
  styles: [
    `
      .page-card {
        padding: 20px;
        max-width: 900px;
      }
      .form {
        display: grid;
        gap: 16px;
        margin: 16px 0;
      }
      .form-row {
        display: grid;
        gap: 16px;
      }
      .form-row.single-column {
        grid-template-columns: 1fr;
      }
      .form-row.two-column {
        grid-template-columns: repeat(2, 1fr);
      }
      .form-group {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .form-group label {
        font-size: 0.875rem;
        font-weight: 500;
        color: #cbd5e1;
      }
      textarea,
      input,
      select {
        padding: 10px 12px;
        border: 1px solid #334155;
        border-radius: 8px;
        background: #0f172a;
        color: #f1f5f9;
        font-size: 1rem;
        min-height: 44px;
      }
      textarea:focus,
      input:focus,
      select:focus {
        outline: none;
        border-color: #7c3aed;
        box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.2);
      }
      textarea {
        min-height: 100px;
        resize: vertical;
      }
      section.section {
        margin-top: 32px;
        padding-top: 24px;
        border-top: 1px solid #1e293b;
      }
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }
      .section-header h3 {
        margin: 0;
        font-size: 1.125rem;
      }
      .file-upload-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        background: #7c3aed;
        color: white;
        border-radius: 8px;
        cursor: pointer;
        font-size: 0.875rem;
        font-weight: 500;
        transition: background 0.2s;
      }
      .file-upload-btn:hover {
        background: #6d28d9;
      }
      .upload-progress {
        padding: 8px;
        color: #7c3aed;
        font-size: 0.875rem;
      }
      .attachment-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        border: 1px solid #334155;
        border-radius: 8px;
        margin-bottom: 8px;
        background: #0f172a;
      }
      .attachment-info {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .attachment-icon {
        font-size: 1.5rem;
      }
      .attachment-name {
        display: block;
        font-weight: 500;
      }
      .attachment-meta {
        display: block;
        color: #94a3b8;
        font-size: 0.75rem;
      }
      .attachment-actions {
        display: flex;
        gap: 8px;
      }
      .comment-form {
        display: grid;
        gap: 12px;
        margin-bottom: 24px;
      }
      .comment-form textarea {
        min-height: 80px;
      }
      .comment {
        padding: 16px;
        border: 1px solid #334155;
        border-radius: 8px;
        margin-bottom: 12px;
        background: #0f172a;
      }
      .comment p {
        margin: 0 0 8px;
        white-space: pre-wrap;
      }
      .comment small {
        display: block;
        color: #94a3b8;
        font-size: 0.75rem;
        margin-bottom: 8px;
      }
      .comment-actions {
        display: flex;
        gap: 8px;
      }
      .comment textarea {
        min-height: 80px;
      }
      .history-entry {
        padding: 12px;
        border-left: 3px solid #7c3aed;
        margin: 8px 0;
        background: #0f172a;
        border-radius: 0 8px 8px 0;
      }
      .history-entry b {
        display: block;
        margin-bottom: 4px;
      }
      .history-entry small {
        color: #94a3b8;
        font-size: 0.75rem;
      }
      .empty-state {
        color: #64748b;
        font-style: italic;
        text-align: center;
        padding: 24px;
      }
      .btn-primary {
        padding: 10px 20px;
        background: #7c3aed;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 500;
        transition: background 0.2s;
      }
      .btn-primary:hover:not(:disabled) {
        background: #6d28d9;
      }
      .btn-primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .btn-secondary {
        padding: 8px 16px;
        background: #334155;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 0.875rem;
      }
      .btn-secondary:hover {
        background: #475569;
      }
      .btn-danger {
        background: #b91c1c;
      }
      .btn-danger:hover {
        background: #991b1b;
      }
      .btn-text {
        background: none;
        border: none;
        color: #7c3aed;
        cursor: pointer;
        font-size: 0.875rem;
        padding: 4px 8px;
      }
      .btn-text:hover {
        text-decoration: underline;
      }
      .btn-text.btn-danger {
        color: #ef4444;
      }
    `,
  ],
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
  protected readonly uploading = signal(false);
  protected readonly editingCommentId = signal<string | null>(null);
  protected commentText = '';
  protected editCommentText = '';

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('id') || '';
    this.taskId = this.route.snapshot.paramMap.get('taskId') || '';
    this.load();
  }

  protected load(): void {
    this.tasks.getTaskDetail(this.projectId, this.taskId).subscribe({
      next: (response) => {
        this.task.set(response.task);
        this.comments.set(response.comments);
        this.attachments.set(response.attachments);
      },
      error: () => {
        // Fallback to basic task load
        this.tasks.getTask(this.projectId, this.taskId).subscribe((v) => this.task.set(v));
      },
    });
    this.loadMembers();
    this.loadSprints();
    this.collaboration.history(this.projectId, this.taskId).subscribe((v) => this.history.set(v));
  }

  protected loadMembers(): void {
    this.memberService.members(this.projectId).subscribe((v) => this.members.set(v));
  }

  protected loadSprints(): void {
    this.sprintService.list(this.projectId).subscribe((v) => this.sprints.set(v));
  }

  protected save(): void {
    const task = this.task();
    if (task) {
      this.tasks
        .updateTask(this.projectId, this.taskId, {
          description: task.description,
          status: task.status,
          priority: task.priority,
          assignee_id: task.assignee_id || undefined,
          sprint_id: task.sprint_id || undefined,
          due_date: task.due_date || undefined,
        })
        .subscribe((v) => this.task.set(v));
    }
  }

  // Attachment methods
  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.uploading.set(true);
      this.tasks.uploadAttachment(this.projectId, this.taskId, file).subscribe({
        next: (attachment) => {
          this.attachments.update((arr) => [...arr, attachment]);
          this.uploading.set(false);
          input.value = '';
        },
        error: () => {
          this.uploading.set(false);
          input.value = '';
        },
      });
    }
  }

  protected getFileIcon(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) return '🖼️';
    if (['pdf'].includes(ext || '')) return '📄';
    if (['doc', 'docx'].includes(ext || '')) return '📝';
    if (['xls', 'xlsx'].includes(ext || '')) return '📊';
    if (['zip', 'rar', '7z'].includes(ext || '')) return '📦';
    return '📎';
  }

  protected formatFileSize(bytes?: number): string {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  protected getDownloadUrl(attachment: TaskAttachment): string {
    return `${environment.apiBaseUrl}/projects/${this.projectId}/tasks/${this.taskId}/attachments/${attachment.id}/download`;
  }

  protected deleteAttachment(attachmentId: string): void {
    if (confirm('Delete this attachment?')) {
      this.tasks.deleteAttachment(this.projectId, this.taskId, attachmentId).subscribe(() => {
        this.attachments.update((arr) => arr.filter((a) => a.id !== attachmentId));
      });
    }
  }

  // Comment methods
  protected addComment(): void {
    if (this.commentText.trim()) {
      this.collaboration.addComment(this.projectId, this.taskId, this.commentText).subscribe(() => {
        this.commentText = '';
        this.loadComments();
      });
    }
  }

  protected loadComments(): void {
    this.collaboration.comments(this.projectId, this.taskId).subscribe((v) => this.comments.set(v));
  }

  protected startCommentEdit(comment: Comment): void {
    this.editingCommentId.set(comment.id);
    this.editCommentText = comment.content;
  }

  protected saveCommentEdit(comment: Comment): void {
    if (this.editCommentText.trim()) {
      this.collaboration
        .updateComment(this.projectId, this.taskId, comment.id, this.editCommentText)
        .subscribe(() => {
          this.editingCommentId.set(null);
          this.editCommentText = '';
          this.loadComments();
        });
    }
  }

  protected cancelCommentEdit(): void {
    this.editingCommentId.set(null);
    this.editCommentText = '';
  }

  protected deleteComment(commentId: string): void {
    if (confirm('Delete this comment?')) {
      this.collaboration.deleteComment(this.projectId, this.taskId, commentId).subscribe(() => {
        this.loadComments();
      });
    }
  }
}
