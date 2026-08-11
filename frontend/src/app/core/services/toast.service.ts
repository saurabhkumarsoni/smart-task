import { Injectable, signal } from '@angular/core';

export type ToastKind = 'error' | 'info' | 'success';

export interface ToastMessage {
  id: number;
  kind: ToastKind;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly nextId = signal(1);
  private readonly _messages = signal<ToastMessage[]>([]);

  readonly messages = this._messages.asReadonly();

  show(message: string, kind: ToastKind = 'info', durationMs = 4500): void {
    const id = this.nextId();
    this.nextId.set(id + 1);

    this._messages.update((list) => [...list, { id, kind, message }]);

    setTimeout(() => {
      this.dismiss(id);
    }, durationMs);
  }

  error(message: string, durationMs = 5000): void {
    this.show(message, 'error', durationMs);
  }

  success(message: string, durationMs = 3500): void {
    this.show(message, 'success', durationMs);
  }

  dismiss(id: number): void {
    this._messages.update((list) => list.filter((message) => message.id !== id));
  }
}
