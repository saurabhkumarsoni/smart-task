import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { httpErrorInterceptor } from './core/interceptors/http-error.interceptor';
import { refreshTokenInterceptor } from './core/interceptors/refresh-token.interceptor';
import { projectsReducer } from './store/projects/reducers';
import { tasksReducer } from './store/tasks/reducers';
import { ProjectsEffects } from './store/projects/effects';
import { TasksEffects } from './store/tasks/effects';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor, httpErrorInterceptor, refreshTokenInterceptor]),
    ),
    provideStore({
      projects: projectsReducer,
      tasks: tasksReducer,
    }),
    provideEffects([ProjectsEffects, TasksEffects]),
  ],
};
