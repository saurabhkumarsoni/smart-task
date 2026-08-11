import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, Observable, shareReplay, switchMap, throwError } from 'rxjs';
import { AuthResponse } from '../models/app-models';
import { AuthService } from '../services/auth.service';

let refreshRequest$: Observable<AuthResponse> | null = null;

function shouldSkipRefresh(url: string): boolean {
  return (
    url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh')
  );
}

export const refreshTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (
        !(error instanceof HttpErrorResponse) ||
        error.status !== 401 ||
        shouldSkipRefresh(req.url)
      ) {
        return throwError(() => error);
      }

      if (!authService.getRefreshToken()) {
        return throwError(() => error);
      }

      if (!refreshRequest$) {
        refreshRequest$ = authService.refreshToken().pipe(
          shareReplay(1),
          finalize(() => {
            refreshRequest$ = null;
          }),
        );
      }

      return refreshRequest$.pipe(
        switchMap(() => {
          const accessToken = authService.getAccessToken();

          if (!accessToken) {
            return throwError(() => error);
          }

          return next(
            req.clone({
              setHeaders: {
                Authorization: `Bearer ${accessToken}`,
              },
            }),
          );
        }),
        catchError((refreshError: unknown) => {
          authService.clearSession();
          router.navigateByUrl('/login');
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
