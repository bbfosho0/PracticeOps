import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  AppointmentStatus,
  ClaimStatus,
  DashboardSnapshot,
  NoteStatus,
  PracticeOpsClient
} from '../../generated/practiceops-api-client';
import { Dashboard } from '../../dashboard-model';

const PORTFOLIO_ACTOR = 'Portfolio reviewer';

@Injectable({ providedIn: 'root' })
export class PracticeOpsApiAdapter {
  private readonly client = inject(PracticeOpsClient);

  loadDashboard(): Observable<Dashboard> {
    return this.client.getDashboard().pipe(map(snapshot => mapDashboard(snapshot)));
  }

  resetDemo(): Observable<Dashboard> {
    return this.client.resetPortfolioDemo().pipe(map(snapshot => mapDashboard(snapshot)));
  }

  transitionAppointment(id: string, status: string): Observable<unknown> {
    return this.client.updateAppointmentStatus(id, {
      status: parseEnum(AppointmentStatus, status, 'appointment status'),
      actor: PORTFOLIO_ACTOR
    });
  }

  transitionNote(id: string, status: string): Observable<unknown> {
    return this.client.updateClinicalNoteStatus(id, {
      status: parseEnum(NoteStatus, status, 'note status'),
      actor: PORTFOLIO_ACTOR
    });
  }

  transitionClaim(id: string, status: string): Observable<unknown> {
    return this.client.updateClaimStatus(id, {
      status: parseEnum(ClaimStatus, status, 'claim status'),
      actor: PORTFOLIO_ACTOR
    });
  }
}

function mapDashboard(snapshot: DashboardSnapshot): Dashboard {
  const metrics = required(snapshot.metrics, 'dashboard.metrics');
  const scenario = required(snapshot.scenario, 'dashboard.scenario');
  const outbox = required(snapshot.outbox, 'dashboard.outbox');

  return {
    metrics: {
      appointmentsToday: required(metrics.appointmentsToday, 'dashboard.metrics.appointmentsToday'),
      unsignedNotes: required(metrics.unsignedNotes, 'dashboard.metrics.unsignedNotes'),
      claimsAtRisk: required(metrics.claimsAtRisk, 'dashboard.metrics.claimsAtRisk'),
      claimExposure: required(metrics.claimExposure, 'dashboard.metrics.claimExposure'),
      teamUtilization: required(metrics.teamUtilization, 'dashboard.metrics.teamUtilization')
    },
    appointments: required(snapshot.appointments, 'dashboard.appointments').map((item, index) => ({
      id: required(item.id, `dashboard.appointments[${index}].id`),
      patientDisplayName: required(item.patientDisplayName, `dashboard.appointments[${index}].patientDisplayName`),
      clinician: required(item.clinician, `dashboard.appointments[${index}].clinician`),
      service: required(item.service, `dashboard.appointments[${index}].service`),
      startsAt: required(item.startsAt, `dashboard.appointments[${index}].startsAt`),
      status: required(item.status, `dashboard.appointments[${index}].status`)
    })),
    notes: required(snapshot.notes, 'dashboard.notes').map((item, index) => ({
      id: required(item.id, `dashboard.notes[${index}].id`),
      appointmentId: required(item.appointmentId, `dashboard.notes[${index}].appointmentId`),
      clinician: required(item.clinician, `dashboard.notes[${index}].clinician`),
      dueAt: required(item.dueAt, `dashboard.notes[${index}].dueAt`),
      status: required(item.status, `dashboard.notes[${index}].status`),
      signedAt: item.signedAt ?? null
    })),
    claims: required(snapshot.claims, 'dashboard.claims').map((item, index) => ({
      id: required(item.id, `dashboard.claims[${index}].id`),
      number: required(item.number, `dashboard.claims[${index}].number`),
      payer: required(item.payer, `dashboard.claims[${index}].payer`),
      amount: required(item.amount, `dashboard.claims[${index}].amount`),
      riskReason: required(item.riskReason, `dashboard.claims[${index}].riskReason`),
      status: required(item.status, `dashboard.claims[${index}].status`),
      updatedAt: required(item.updatedAt, `dashboard.claims[${index}].updatedAt`)
    })),
    audit: required(snapshot.audit, 'dashboard.audit').map((item, index) => ({
      id: required(item.id, `dashboard.audit[${index}].id`),
      actor: required(item.actor, `dashboard.audit[${index}].actor`),
      action: required(item.action, `dashboard.audit[${index}].action`),
      entityType: required(item.entityType, `dashboard.audit[${index}].entityType`),
      entityId: required(item.entityId, `dashboard.audit[${index}].entityId`),
      summary: required(item.summary, `dashboard.audit[${index}].summary`),
      occurredAt: required(item.occurredAt, `dashboard.audit[${index}].occurredAt`)
    })),
    scenario: {
      id: required(scenario.id, 'dashboard.scenario.id'),
      title: required(scenario.title, 'dashboard.scenario.title'),
      appointmentId: required(scenario.appointmentId, 'dashboard.scenario.appointmentId'),
      clinicalNoteId: required(scenario.clinicalNoteId, 'dashboard.scenario.clinicalNoteId'),
      claimId: required(scenario.claimId, 'dashboard.scenario.claimId'),
      completedSteps: required(scenario.completedSteps, 'dashboard.scenario.completedSteps'),
      totalSteps: required(scenario.totalSteps, 'dashboard.scenario.totalSteps'),
      completionPercent: required(scenario.completionPercent, 'dashboard.scenario.completionPercent'),
      currentStepId: scenario.currentStepId ?? null,
      currentWorkspace: scenario.currentWorkspace ?? null,
      steps: required(scenario.steps, 'dashboard.scenario.steps').map((step, index) => ({
        id: required(step.id, `dashboard.scenario.steps[${index}].id`),
        label: required(step.label, `dashboard.scenario.steps[${index}].label`),
        description: required(step.description, `dashboard.scenario.steps[${index}].description`),
        workspace: required(step.workspace, `dashboard.scenario.steps[${index}].workspace`),
        state: required(step.state, `dashboard.scenario.steps[${index}].state`)
      }))
    },
    outbox: {
      totalMessages: required(outbox.totalMessages, 'dashboard.outbox.totalMessages'),
      pendingMessages: required(outbox.pendingMessages, 'dashboard.outbox.pendingMessages'),
      publishedMessages: required(outbox.publishedMessages, 'dashboard.outbox.publishedMessages'),
      latestEventType: outbox.latestEventType ?? null,
      latestOccurredAt: outbox.latestOccurredAt ?? null,
      latestPublishedAt: outbox.latestPublishedAt ?? null
    }
  };
}

function parseEnum<T extends Record<string, string>>(values: T, value: string, label: string): T[keyof T] {
  const match = Object.values(values).find(candidate => candidate === value);
  if (!match) {
    throw new Error(`Unsupported ${label}: ${value}`);
  }
  return match as T[keyof T];
}

function required<T>(value: T | null | undefined, path: string): T {
  if (value === null || value === undefined) {
    throw new Error(`OpenAPI contract violation: ${path} is required.`);
  }
  return value;
}
