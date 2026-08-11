import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-comment-item',
  standalone: true,
  template: '<article><strong>{{ author }}</strong><p>{{ content }}</p></article>',
})
export class CommentItemComponent {
  @Input() author = 'User';
  @Input() content = '';
}
