import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Dashboard } from './dashboard-model';

const PORTFOLIO_ACTOR = 'Portfolio reviewer';

@Injectable({ providedIn: 'root' })
export class PracticeOpsApiService {
  private readonly http = inject(HttpClient);

  loadDashboard(): Observable<Dashboard> {
    return this.http.get<Dashboard>('/api/dashboard');
  }

  resetDemo(): Observable<Dashboard> {
    return this.http.post<Dashboard>('/api/demo/reset', {});
  }

  transitionAppointment(id: string, status: string): Observable<unknown> {
    return this.http.post(`/api/appointments/${id}/status`, { status, actor: PORTFOLIO_ACTOR });
  }

  transitionNote(id: string, status: string): Observable<unknown> {
    return this.http.post(`/api/notes/${id}/status`, { status, actor: PORTFOLIO_ACTOR });
  }

  transitionClaim(id: string, status: string): Observable<unknown> {
    return this.http.post(`/api/claims/${id}/status`, { status, actor: PORTFOLIO_ACTOR });
  }
}
