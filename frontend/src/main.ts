import 'zone.js';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';

interface Dashboard {
  metrics: { appointmentsToday: number; unsignedNotes: number; claimsAtRisk: number; claimExposure: number; teamUtilization: number };
  appointments: Array<{ id: string; patientDisplayName: string; clinician: string; service: string; startsAt: string; status: string }>;
  notes: Array<{ id: string; clinician: string; dueAt: string; status: string }>;
  claims: Array<{ id: string; number: string; payer: string; amount: number; riskReason: string; status: string }>;
  audit: Array<{ id: string; actor: string; action: string; summary: string; occurredAt: string }>;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, DecimalPipe],
  template: `
    <div class="shell">
      <aside>
        <div class="brand">PracticeOps<small>Behavioral health operations</small></div>
        <nav>@for (item of nav; track item) { <button [class.active]="item === 'Overview'">{{ item }}</button> }</nav>
        <p class="synthetic">Synthetic data only</p>
      </aside>
      <main>
        <header><div><h1>Operations overview</h1><p>Monitor today’s schedule, documentation readiness, and revenue-cycle risk.</p></div><div class="avatar">YG</div></header>
        @if (loading()) { <section class="state">Loading operations data...</section> }
        @if (error()) { <section class="state error">{{ error() }} <button (click)="load()">Retry</button></section> }
        @if (dashboard(); as data) {
          <section class="metrics">
            <article><span>Appointments today</span><strong>{{ data.metrics.appointmentsToday }}</strong><small>Operational queue</small></article>
            <article><span>Unsigned notes</span><strong>{{ data.metrics.unsignedNotes }}</strong><small>Documentation work</small></article>
            <article><span>Claims at risk</span><strong>{{ data.metrics.claimsAtRisk }}</strong><small>{{ data.metrics.claimExposure | currency }} exposure</small></article>
            <article><span>Team utilization</span><strong>{{ data.metrics.teamUtilization | number }}%</strong><small>Fictional benchmark</small></article>
          </section>
          <section class="grid">
            <article class="panel wide"><h2>Today’s schedule</h2>
              @for (appointment of data.appointments; track appointment.id) {
                <div class="row"><time>{{ appointment.startsAt | date:'shortTime' }}</time><div><b>{{ appointment.patientDisplayName }}</b><small>{{ appointment.service }} · {{ appointment.clinician }}</small></div><span class="tag">{{ appointment.status }}</span></div>
              }
            </article>
            <article class="panel"><h2>Documentation readiness</h2>
              @for (item of noteSummary(); track item.label) { <div class="summary"><strong>{{ item.value }}</strong><span>{{ item.label }}</span></div> }
            </article>
            <article class="panel wide"><h2>Claims risk queue</h2>
              @for (claim of data.claims; track claim.id) { <div class="claim"><b>{{ claim.number }}</b><span>{{ claim.payer }}</span><strong>{{ claim.amount | currency }}</strong><em>{{ claim.riskReason }}</em></div> }
            </article>
            <article class="panel"><h2>Recent activity</h2>
              @for (event of data.audit; track event.id) { <div class="activity"><time>{{ event.occurredAt | date:'shortTime' }}</time><div><b>{{ event.action }}</b><small>{{ event.summary }}</small></div></div> }
            </article>
          </section>
        }
      </main>
    </div>
  `
})
export class AppComponent {
  private readonly http = inject(HttpClient);
  readonly nav = ['Overview', 'Schedule', 'Documentation', 'Claims', 'Audit log', 'Settings'];
  readonly dashboard = signal<Dashboard | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly noteSummary = computed(() => {
    const notes = this.dashboard()?.notes ?? [];
    return [
      { label: 'Ready for billing', value: notes.filter(n => n.status === 'Signed').length },
      { label: 'In review', value: notes.filter(n => n.status === 'InReview').length },
      { label: 'Draft notes', value: notes.filter(n => n.status === 'Draft').length }
    ];
  });
  constructor() { this.load(); }
  load(): void {
    this.loading.set(true); this.error.set('');
    this.http.get<Dashboard>('/api/dashboard').subscribe({
      next: value => { this.dashboard.set(value); this.loading.set(false); },
      error: () => { this.error.set('The API is unavailable. Start the backend and retry.'); this.loading.set(false); }
    });
  }
}

bootstrapApplication(AppComponent, { providers: [provideHttpClient()] }).catch(console.error);
