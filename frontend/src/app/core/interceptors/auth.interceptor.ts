import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const raw = localStorage.getItem('smart-task-auth');

  if (!raw) {
    return next(req);
  }

  try {
    const parsed = JSON.parse(raw) as { access_token?: string };
    const token = parsed.access_token;

    if (!token) {
      return next(req);
    }

    return next(
      req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      }),
    );
  } catch {
    return next(req);
  }
};
