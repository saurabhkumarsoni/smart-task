import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-notification-item',
  standalone: true,
  template: '<article><strong>{{ title }}</strong><p>{{ detail }}</p></article>',
})
export class NotificationItemComponent {
  @Input() title = '';
  @Input() detail = '';
}
