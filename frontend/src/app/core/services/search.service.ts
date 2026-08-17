import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SearchResponse } from '../models/search.model';

@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/search`;

  search(query: string, limit = 8): Observable<SearchResponse> {
    const normalized = query.trim();

    const params = new HttpParams().set('q', normalized).set('limit', String(limit));

    return this.http.get<SearchResponse>(this.apiUrl, { params });
  }
}
