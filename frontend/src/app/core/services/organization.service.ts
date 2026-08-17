import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import { Member, Organization, OrganizationRole } from '../models/app-models';

/**
 * Payload used to create an organization.
 */
export interface OrganizationCreatePayload {
  name: string;
  slug: string;
  description?: string | null;
}

/**
 * Payload used to update an organization.
 */
export interface OrganizationUpdatePayload {
  name?: string;
  description?: string | null;
  is_active?: boolean;
}

/**
 * Payload used to add a member.
 */
export interface OrganizationMemberCreatePayload {
  user_id: string;
  role: OrganizationRole;
}

/**
 * Payload used to update a member role.
 */
export interface OrganizationMemberRoleUpdatePayload {
  role: OrganizationRole;
}

@Injectable({
  providedIn: 'root',
})
export class OrganizationService {
  private readonly http = inject(HttpClient);

  private readonly url = `${environment.apiBaseUrl}/organizations`;

  /**
   * Get organizations available to the current user.
   *
   * GET /organizations
   */
  list(): Observable<Organization[]> {
    return this.http.get<Organization[]>(this.url);
  }

  /**
   * Create organization.
   *
   * POST /organizations
   */
  create(data: OrganizationCreatePayload): Observable<Organization> {
    return this.http.post<Organization>(this.url, data);
  }

  /**
   * Update organization.
   *
   * PUT /organizations/{organization_id}
   */
  update(id: string, data: OrganizationUpdatePayload): Observable<Organization> {
    return this.http.put<Organization>(`${this.url}/${id}`, data);
  }

  /**
   * Get organization members.
   *
   * GET /organizations/{organization_id}/members
   *
   * IMPORTANT:
   * Current backend returns:
   *
   * id
   * organization_id
   * user_id
   * role
   * joined_at
   *
   * It currently does not return user name/email.
   */
  members(organizationId: string): Observable<Member[]> {
    return this.http.get<Member[]>(`${this.url}/${organizationId}/members`);
  }

  /**
   * Add a member to an organization.
   *
   * POST /organizations/{organization_id}/members
   */
  invite(
    organizationId: string,
    userId: string,
    role: OrganizationRole = 'member',
  ): Observable<Member> {
    const payload: OrganizationMemberCreatePayload = {
      user_id: userId,
      role,
    };

    return this.http.post<Member>(`${this.url}/${organizationId}/members`, payload);
  }

  /**
   * Update organization member role.
   *
   * PUT /organizations/{organization_id}/members/{user_id}
   */
  updateRole(organizationId: string, userId: string, role: OrganizationRole): Observable<Member> {
    const payload: OrganizationMemberRoleUpdatePayload = {
      role,
    };

    return this.http.put<Member>(`${this.url}/${organizationId}/members/${userId}`, payload);
  }

  /**
   * Helper for extracting FastAPI error messages.
   *
   * This keeps API error parsing out of components.
   */
  getErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
    if (!(error instanceof HttpErrorResponse)) {
      return fallback;
    }

    const errorBody = error.error;

    if (typeof errorBody === 'object' && errorBody !== null) {
      const body = errorBody as {
        detail?: string;
        message?: string;
      };

      if (body.detail) {
        return body.detail;
      }

      if (body.message) {
        return body.message;
      }
    }

    if (typeof errorBody === 'string') {
      return errorBody;
    }

    return fallback;
  }
}
