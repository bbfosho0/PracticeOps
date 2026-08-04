import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import {
  ApiException,
  Appointment as GeneratedAppointment,
  AppointmentStatus,
  AuditEntry as GeneratedAuditEntry,
  Claim as GeneratedClaim,
  ClaimStatus,
  ClinicalNote as GeneratedClinicalNote,
  DashboardSnapshot,
  NoteStatus,
  PracticeOpsClient
} from '../../generated/practiceops-api-client';
import {
  Appointment,
  AuditEvent,
  Claim,
  ClinicalNote,
  Dashboard,
  ScenarioStepState,
  ViewId
} from '../../dashboard-model';

const PORTFOLIO_ACTOR = 'Portfolio reviewer';

@Injectable({ providedIn: 'root' })
export class PracticeOpsApiAdapter {
  private readonly client = inject(PracticeOpsClient);

  loadDashboard(): Observable<Dashboard> {
    return this.client.getDashboard().pipe(
      map(snapshot => mapDashboard(snapshot)),
      catchError(error => throwError(() => applicationTransportError(error)))
    );
  }

  resetDemo(): Observable<Dashboard> {
    return this.client.resetPortfolioDemo().pipe(
      map(snapshot => mapDashboard(snapshot)),
      catchError(error => throwError(() => applicationTransportError(error)))
    );
  }

  transitionAppointment(id: string, status: string): Observable<Appointment> {
    return this.client.updateAppointmentStatus(id, {
      status: parseEnum(AppointmentStatus, status, 'appointment status'),
      actor: PORTFOLIO_ACTOR
    }).pipe(
      map(value => mapAppointment(value, 'appointment mutation')),
      catchError(error => throwError(() => applicationTransportError(error)))
    );
  }

  transitionNote(id: string, status: string): Observable<ClinicalNote> {
    return this.client.updateClinicalNoteStatus(id, {
      status: parseEnum(NoteStatus, status, 'note status'),
      actor: PORTFOLIO_ACTOR
    }).pipe(
      map(value => mapClinicalNote(value, 'note mutation')),
      catchError(error => throwError(() => applicationTransportError(error)))
    );
  }

  transitionClaim(id: string, status: string): Observable<Claim> {
    return this.client.updateClaimStatus(id, {
      status: parseEnum(ClaimStatus, status, 'claim status'),
      actor: PORTFOLIO_ACTOR
    }).pipe(
      map(value => mapClaim(value, 'claim mutation')),
      catchError(error => throwError(() => applicationTransportError(error)))
    );
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
    appointments: required(snapshot.appointments, 'dashboard.appointments')
      .map((item, index) => mapAppointment(item, `dashboard.appointments[${index}]`)),
    notes: required(snapshot.notes, 'dashboard.notes')
      .map((item, index) => mapClinicalNote(item, `dashboard.notes[${index}]`)),
    claims: required(snapshot.claims, 'dashboard.claims')
      .map((item, index) => mapClaim(item, `dashboard.claims[${index}]`)),
    audit: required(snapshot.audit, 'dashboard.audit')
      .map((item, index) => mapAuditEvent(item, `dashboard.audit[${index}]`)),
    scenario: {
      id: required(scenario.id, 'dashboard.scenario.id'),
      title: required(scenario.title, 'dashboard.scenario.title'),
      appointmentId: required(scenario.appointmentId, 'dashboard.scenario.appointmentId'),
      clinicalNoteId: required(scenario.clinicalNoteId, 'dashboard.scenario.clinicalNoteId'),
      claimId: required(scenario.claimId, 'dashboard.scenario.claimId'),
      completedSteps: required(scenario.completedSteps, 'dashboard.scenario.completedSteps'),
      totalSteps: required(scenario.totalSteps, 'dashboard.scenario.totalSteps'),
      completionPercent: required(scenario.completionPercent, 'dashboard.scenario.completionPercent'),
      currentStepId: required(scenario.currentStepId, 'dashboard.scenario.currentStepId'),
      currentWorkspace: parseStringUnion(
        VIEW_IDS,
        required(scenario.currentWorkspace, 'dashboard.scenario.currentWorkspace'),
        'dashboard.scenario.currentWorkspace'
      ),
      steps: required(scenario.steps, 'dashboard.scenario.steps').map((step, index) => ({
        id: required(step.id, `dashboard.scenario.steps[${index}].id`),
        label: required(step.label, `dashboard.scenario.steps[${index}].label`),
        description: required(step.description, `dashboard.scenario.steps[${index}].description`),
        workspace: parseStringUnion(
          VIEW_IDS,
          required(step.workspace, `dashboard.scenario.steps[${index}].workspace`),
          `dashboard.scenario.steps[${index}].workspace`
        ),
        state: parseStringUnion(
          SCENARIO_STEP_STATES,
          required(step.state, `dashboard.scenario.steps[${index}].state`),
          `dashboard.scenario.steps[${index}].state`
        )
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

const VIEW_IDS: readonly ViewId[] = ['overview', 'schedule', 'documentation', 'claims', 'audit', 'settings'];
const SCENARIO_STEP_STATES: readonly ScenarioStepState[] = ['complete', 'current', 'pending'];

function mapAppointment(value: GeneratedAppointment, path: string): Appointment {
  return {
    id: required(value.id, `${path}.id`),
    patientDisplayName: required(value.patientDisplayName, `${path}.patientDisplayName`),
    clinician: required(value.clinician, `${path}.clinician`),
    service: required(value.service, `${path}.service`),
    startsAt: required(value.startsAt, `${path}.startsAt`),
    status: parseEnum(
      AppointmentStatus,
      required(value.status, `${path}.status`),
      `${path}.status`
    )
  };
}

function mapClinicalNote(value: GeneratedClinicalNote, path: string): ClinicalNote {
  return {
    id: required(value.id, `${path}.id`),
    appointmentId: required(value.appointmentId, `${path}.appointmentId`),
    clinician: required(value.clinician, `${path}.clinician`),
    dueAt: required(value.dueAt, `${path}.dueAt`),
    status: parseEnum(NoteStatus, required(value.status, `${path}.status`), `${path}.status`)
  };
}

function mapClaim(value: GeneratedClaim, path: string): Claim {
  return {
    id: required(value.id, `${path}.id`),
    number: required(value.number, `${path}.number`),
    payer: required(value.payer, `${path}.payer`),
    amount: required(value.amount, `${path}.amount`),
    riskReason: required(value.riskReason, `${path}.riskReason`),
    status: parseEnum(ClaimStatus, required(value.status, `${path}.status`), `${path}.status`)
  };
}

function mapAuditEvent(value: GeneratedAuditEntry, path: string): AuditEvent {
  return {
    id: required(value.id, `${path}.id`),
    actor: required(value.actor, `${path}.actor`),
    action: required(value.action, `${path}.action`),
    entityType: required(value.entityType, `${path}.entityType`),
    entityId: required(value.entityId, `${path}.entityId`),
    summary: required(value.summary, `${path}.summary`),
    occurredAt: required(value.occurredAt, `${path}.occurredAt`)
  };
}

function parseEnum<T extends Record<string, string>>(values: T, value: string, label: string): T[keyof T] {
  const match = Object.values(values).find(candidate => candidate === value);
  if (!match) {
    throw new Error(`Unsupported ${label}: ${value}`);
  }
  return match as T[keyof T];
}

function parseStringUnion<T extends string>(values: readonly T[], value: string, path: string): T {
  const match = values.find(candidate => candidate === value);
  if (!match) {
    throw new Error(`OpenAPI contract violation: ${path} has unsupported value ${value}.`);
  }
  return match;
}

function applicationTransportError(error: unknown): unknown {
  if (!(error instanceof ApiException)) {
    return error;
  }

  return new HttpErrorResponse({
    error: error.result ?? error.response,
    status: error.status,
    statusText: error.message
  });
}

function required<T>(value: T | null | undefined, path: string): T {
  if (value === null || value === undefined) {
    throw new Error(`OpenAPI contract violation: ${path} is required.`);
  }
  return value;
}
