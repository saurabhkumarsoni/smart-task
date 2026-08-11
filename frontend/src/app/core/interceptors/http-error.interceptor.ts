import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, tap, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

function shouldShowSuccessToast(method: string, url: string): boolean {
  const normalizedMethod = method.toUpperCase();

  if (
    normalizedMethod === 'POST' ||
    normalizedMethod === 'PUT' ||
    normalizedMethod === 'PATCH' ||
    normalizedMethod === 'DELETE'
  ) {
    // Skip noisy background auth refresh calls.
    return !url.includes('/auth/refresh');
  }

  return false;
}

function getSuccessMessage(method: string, url: string, body: unknown): string {
  const payload = body as { message?: unknown; detail?: unknown } | string | null;

  if (typeof payload === 'string' && payload.trim()) {
    return payload;
  }

  if (payload && typeof payload === 'object') {
    if (typeof payload.message === 'string' && payload.message.trim()) {
      return payload.message;
    }

    if (typeof payload.detail === 'string' && payload.detail.trim()) {
      return payload.detail;
    }
  }

  if (url.includes('/auth/login')) {
    return 'Signed in successfully.';
  }

  if (url.includes('/auth/register')) {
    return 'Account created successfully.';
  }

  if (url.includes('/auth/logout')) {
    return 'Signed out successfully.';
  }

  switch (method.toUpperCase()) {
    case 'POST':
      return 'Created successfully.';
    case 'PUT':
    case 'PATCH':
      return 'Updated successfully.';
    case 'DELETE':
      return 'Deleted successfully.';
    default:
      return 'Request completed successfully.';
  }
}

function getErrorMessage(error: HttpErrorResponse): string {
  if (error.status === 0) {
    return 'Unable to reach the server. Please check your connection or backend CORS settings.';
  }

  const payload = error.error as { detail?: unknown; message?: unknown } | string | null;

  if (typeof payload === 'string' && payload.trim()) {
    return payload;
  }

  if (payload && typeof payload === 'object') {
    if (typeof payload.detail === 'string' && payload.detail.trim()) {
      return payload.detail;
    }

    if (typeof payload.message === 'string' && payload.message.trim()) {
      return payload.message;
    }
  }

  if (error.status === 401) {
    return 'You are not authorized. Please sign in again.';
  }

  if (error.status === 403) {
    return 'You do not have permission to perform this action.';
  }

  if (error.status === 404) {
    return 'Requested resource was not found.';
  }

  if (error.status >= 500) {
    return 'Server error occurred. Please try again in a moment.';
  }

  return `Request failed (${error.status}).`;
}

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);

  return next(req).pipe(
    tap((event) => {
      if (!(event instanceof HttpResponse)) {
        return;
      }

      if (!shouldShowSuccessToast(req.method, req.url)) {
        return;
      }

      toastService.success(getSuccessMessage(req.method, req.url, event.body));
    }),
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        toastService.error(getErrorMessage(error));
      } else {
        toastService.error('Unexpected error occurred. Please try again.');
      }

      return throwError(() => error);
    }),
  );
};
