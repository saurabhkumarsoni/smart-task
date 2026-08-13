# Smart Task - Frontend & Backend Analysis

## Backend Architecture (FastAPI)

### API Structure

- **Base URL**: `/api/v1`
- **Authentication**: JWT-based with access/refresh tokens
- **CORS**: Configured for `http://localhost:4200`

### Modules & Endpoints

#### 1. Authentication (`/api/v1/auth`)

- `POST /register` - User registration
- `POST /login` - User login (returns access + refresh tokens)
- `POST /refresh` - Refresh access token
- `POST /logout` - Logout (blacklists refresh token)
- `POST /change-password` - Change password (authenticated)
- `POST /verify-email` - Verify email with token
- `POST /forgot-password` - Request password reset
- `POST /reset-password` - Reset password with token
- `GET /me` - Get current user profile
- `GET /admin-check` - Admin role check
- `POST /activate-account` - Admin activate/deactivate user

#### 2. Organizations (`/api/v1/organizations`)

- `POST /` - Create organization
- `GET /` - List user's organizations
- `PUT /{id}` - Update organization
- `POST /{id}/members` - Add member
- `GET /{id}/members` - List members
- `PUT /{id}/members/{user_id}` - Update member role

#### 3. Projects (`/api/v1/projects`)

- `POST /` - Create project
- `GET /` - List user's projects
- `GET /overview` - Workspace overview
- `GET /{id}/overview` - Project overview
- `GET /{id}` - Get project details
- `PUT /{id}` - Update project (owner/admin)
- `DELETE /{id}` - Delete project (owner)
- `POST /{id}/members` - Add member (owner/admin)
- `GET /{id}/members` - List members
- `PUT /{id}/members/{user_id}` - Update member role (owner/admin)
- `DELETE /{id}/members/{user_id}` - Remove member (owner/admin)

#### 4. Tasks (`/api/v1/projects/{project_id}/tasks`)

- `POST /` - Create task (owner/admin/member)
- `GET /` - List tasks with filters (all roles)
- `GET /overview` - Task overview with metrics
- `GET /{task_id}` - Get task
- `GET /{task_id}/detail` - Get task detail
- `PATCH /{task_id}` - Update task (owner/admin/member)
- `DELETE /{task_id}` - Delete task (owner/admin)

#### 5. Sprints (`/api/v1/projects/{project_id}/sprints`)

- `POST /` - Create sprint
- `GET /` - List sprints
- `PUT /{sprint_id}` - Update sprint
- `POST /{sprint_id}/tasks/{task_id}` - Assign task to sprint

#### 6. Dashboards (`/api/v1`)

- `GET /dashboard/workspace` - Workspace dashboard
- `GET /projects/{project_id}/dashboard` - Project dashboard

#### 7. Comments (`/api/v1/projects/{project_id}/tasks/{task_id}/comments`)

- `POST /` - Create comment
- `GET /` - List comments
- `PATCH /{comment_id}` - Update comment
- `DELETE /{comment_id}` - Delete comment

#### 8. Notifications (`/api/v1/notifications`)

- `GET /` - List notifications
- `GET /summary` - Notification summary
- `POST /{id}/read` - Mark as read

#### 9. Task History (`/api/v1/projects/{project_id}/tasks/{task_id}/history`)

- `GET /` - Get task history

### Data Models (Key Fields)

**User**: id, email, username, first_name, last_name, is_active, is_verified, role
**Project**: id, name, key, description, owner_id, is_active, created_at
**Task**: id, project_id, title, description, status, priority, assignee_id, sprint_id, due_date, created_by, created_at
**Sprint**: id, project_id, name, goal, start_date, end_date, is_active
**Organization**: id, name, slug, description, is_active
**Member**: id, user_id, role (owner/admin/member/viewer), user_name, user_email
**Comment**: id, task_id, author_id, content, created_at
**Notification**: id, user_id, task_id, title, message, is_read, created_at

---

## Frontend Architecture (Angular 18+)

### Project Structure

```
src/app/
├── app.config.ts          # App configuration
├── app.routes.ts          # Routing configuration
├── core/                  # Core services, guards, interceptors
│   ├── guards/
│   ├── interceptors/
│   ├── layouts/
│   ├── models/
│   └── services/
├── features/              # Feature modules
│   ├── auth/
│   ├── comments/
│   ├── dashboard/
│   ├── notifications/
│   ├── organizations/
│   ├── projects/
│   ├── settings/
│   ├── sprints/
│   └── tasks/
├── shared/                # Shared components
└── store/                 # NgRx state management
```

### Current Implementation Status

#### ✅ Implemented Features

1. **Authentication** - Login, Register, Forgot/Reset Password, Email Verification, Change Password
2. **Projects** - List, Create, Detail view with tabs (Overview, Members, Sprints, Settings)
3. **Tasks** - List with filtering, Create, Detail view
4. **Sprints** - Basic list/create in project detail
5. **Organizations** - List, Create, Member management
6. **Dashboard** - Workspace dashboard with metrics
7. **Notifications** - List with mark-as-read
8. **Comments** - Service exists, UI needed
9. **Task History** - Service exists, UI needed

#### 🔧 Services Available

- `AuthService` - Complete auth flow
- `ProjectService` - CRUD operations
- `TaskService` - CRUD operations
- `SprintService` - CRUD + assign task
- `OrganizationService` - CRUD + member management
- `ProjectMemberService` - Member operations
- `DashboardService` - Workspace & project dashboards
- `CollaborationService` - Comments, history, notifications

#### 📦 State Management (NgRx)

- Projects store (actions, selectors)
- Other stores likely needed

---

## Gap Analysis

### Backend Features Not Fully Exposed in Frontend

| Feature                | Backend                      | Frontend           | Status     |
| ---------------------- | ---------------------------- | ------------------ | ---------- |
| Task Detail View       | ✅ `/detail` endpoint        | ❌ Basic only      | Partial    |
| Task Comments          | ✅ Full CRUD                 | ❌ Service only    | Missing UI |
| Task History           | ✅ Full endpoint             | ❌ Service only    | Missing UI |
| Sprint Board View      | ❌ No dedicated endpoint     | ❌ Route exists    | Missing    |
| Project Board (Kanban) | ❌ No dedicated endpoint     | ✅ Route exists    | Missing    |
| Backlog View           | ❌ No dedicated endpoint     | ✅ Route exists    | Missing    |
| Task Filtering/Sorting | ✅ Comprehensive             | ⚠️ Basic only      | Partial    |
| Task Overview/Metrics  | ✅ `/overview` endpoint      | ❌ Not used        | Missing    |
| Workspace Dashboard    | ✅ Full endpoint             | ✅ Implemented     | Complete   |
| Project Dashboard      | ✅ Full endpoint             | ❌ Not used        | Missing    |
| Notification Digest    | ✅ In summary                | ❌ Not shown       | Partial    |
| File Attachments       | ❌ Model exists              | ❌ Not implemented | Missing    |
| User Profile/Settings  | ✅ `/me`, `/change-password` | ✅ Partial         | Partial    |

### Frontend Routes Defined But Not Implemented

- `/projects/:id/board` → `ProjectBoardPage` (Kanban board)
- `/projects/:id/backlog` → `BacklogComponent`
- `/projects/:id/tasks/:taskId` → `TaskDetailComponent` (needs enhancement)
- `/projects/:id/dashboard` → `DashboardPage` (project-specific)

---

## Implementation Plan

### Phase 1: Core Task Management Enhancement

1. **Enhanced Task Detail Component**
   - Full task detail view with all fields
   - Comments section (create, list, edit, delete)
   - History timeline
   - Assignee, sprint, due date management

2. **Task List Improvements**
   - Advanced filtering (status, priority, assignee, dates, search)
   - Sorting options
   - Pagination
   - Task overview metrics

### Phase 2: Board & Backlog Views

3. **Kanban Board** (`/projects/:id/board`)
   - Columns by status (Todo, In Progress, Review, Done)
   - Drag & drop between columns
   - Task cards with key info
   - Quick actions

4. **Backlog View** (`/projects/:id/backlog`)
   - Prioritized task list
   - Sprint assignment
   - Bulk operations

### Phase 3: Sprint Management

5. **Sprint Board** (`/projects/:id/sprints/:sprintId/board`)
   - Sprint-specific Kanban
   - Sprint goal tracking
   - Burndown chart

6. **Sprint Planning**
   - Drag tasks from backlog to sprint
   - Capacity planning

### Phase 4: Dashboard & Analytics

7. **Project Dashboard** (`/projects/:id/dashboard`)
   - Project-specific metrics
   - Charts (status, priority, trend)
   - Team performance

8. **Enhanced Workspace Dashboard**
   - Cross-project insights
   - Personal task summary

### Phase 5: Collaboration Features

9. **Comments System**
   - Real-time updates (WebSocket)
   - Mentions (@user)
   - Rich text support

10. **Notifications Enhancement**
    - Real-time notifications
    - Notification preferences
    - Email digest

### Phase 6: Advanced Features

11. **File Attachments**
    - Upload/download
    - Preview

12. **User Profile & Settings**
    - Profile management
    - Notification preferences
    - Theme settings

13. **Search & Filtering**
    - Global search
    - Saved filters

---

## Technical Considerations

### API Integration Patterns

- Use Angular HttpClient with interceptors for auth
- NgRx for complex state (projects, tasks, sprints)
- Signals for local component state
- Reactive forms for all inputs

### Performance

- Virtual scrolling for large lists
- Pagination for all list endpoints
- Optimistic updates for mutations
- Caching with NgRx selectors

### UX Patterns

- Consistent loading/error states
- Toast notifications for actions
- Confirmation dialogs for destructive actions
- Responsive design (mobile-first)

### Security

- JWT token refresh interceptor
- Route guards for auth/roles
- Input validation/sanitization
- XSS prevention

---

## Next Steps

1. **Immediate**: Enhance Task Detail component with comments & history
2. **Short-term**: Implement Kanban Board and Backlog views
3. **Medium-term**: Sprint management and Project Dashboard
4. **Long-term**: Real-time features, advanced analytics, attachments

Each module should be implemented with:

- Component(s) with proper TypeScript types
- Service methods for all API endpoints
- NgRx actions/reducers/selectors where needed
- Unit tests for services/components
- E2E tests for critical flows
