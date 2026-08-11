import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-user-avatar',
  standalone: true,
  template: ` <img class="avatar" [src]="src" [alt]="alt" /> `,
  styles: [
    `
      .avatar {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        border: 1px solid #cbd5e1;
        object-fit: cover;
      }
    `,
  ],
})
export class UserAvatarComponent {
  @Input({ required: true }) src = '';
  @Input() alt = 'User avatar';
}
