import { Incident, IncidentStatus, TimelineEntry, IncidentSubmissionData } from '../types/incident.ts';
import { INITIAL_SAMPLE_INCIDENTS } from '../data/sampleIncidents.ts';
import { runDeterministicClassification } from './aiClassifier.ts';

const STORAGE_KEY = 'civicsos_incidents_v2';
const INCIDENT_EVENT = 'civicsos_incidents_updated';

function getLocalIncidents(): Incident[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SAMPLE_INCIDENTS));
      return INITIAL_SAMPLE_INCIDENTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SAMPLE_INCIDENTS));
    return INITIAL_SAMPLE_INCIDENTS;
  } catch (err) {
    console.warn('Error reading from localStorage:', err);
    return INITIAL_SAMPLE_INCIDENTS;
  }
}

function saveLocalIncidents(incidents: Incident[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(incidents));
    window.dispatchEvent(new CustomEvent(INCIDENT_EVENT, { detail: incidents }));
  } catch (err) {
    console.warn('Error saving to localStorage:', err);
  }
}

export const incidentStorage = {
  getIncidentsSync(): Incident[] {
    return getLocalIncidents();
  },

  async getAllIncidents(): Promise<Incident[]> {
    try {
      const res = await fetch('/api/incidents', {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          saveLocalIncidents(data);
          return data;
        }
      }
    } catch {
      // Server not reached, fallback to localStorage
    }
    return getLocalIncidents();
  },

  async getIncidentById(id: string): Promise<Incident | null> {
    try {
      const res = await fetch(`/api/incidents/${id}`, {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const incident = await res.json();
        return incident;
      }
    } catch {
      // Fallback to local
    }
    const all = getLocalIncidents();
    return all.find((inc) => inc.id === id) || null;
  },

  async createIncident(
    payload: IncidentSubmissionData
  ): Promise<Incident> {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const incidentId = `SOS-${new Date().getFullYear()}-${randomSuffix}`;
    const createdAt = new Date().toISOString();

    // 1. Try server-side enhanced AI triage
    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          id: incidentId,
          createdAt,
        }),
      });

      if (res.ok) {
        const saved: Incident = await res.json();
        const current = getLocalIncidents();
        const updated = [saved, ...current.filter((i) => i.id !== saved.id)];
        saveLocalIncidents(updated);
        return saved;
      }
    } catch (networkErr) {
      console.warn('Backend unavailable, using client-side deterministic fallback triage:', networkErr);
    }

    // 2. Client-side deterministic fallback triage
    const aiResult = runDeterministicClassification(
      payload.emergencyType,
      payload.severity,
      payload.peopleAffected,
      payload.description,
      payload.location
    );

    const newIncident: Incident = {
      ...payload,
      id: incidentId,
      createdAt,
      aiCategory: aiResult.aiCategory,
      priority: aiResult.priority,
      priorityReason: aiResult.priorityReason,
      keyRiskFactors: aiResult.keyRiskFactors,
      recommendedResponse: aiResult.recommendedResponse,
      suggestedResponseTeam: aiResult.suggestedResponseTeam,
      status: 'New',
      assignedResponder: null,
      assignedResponderRole: undefined,
      assignedResponderSpecialization: undefined,
      assignedAt: null,
      resolvedAt: null,
      resolutionNotes: null,
      isSample: false,
      aiSource: 'rule-engine',
      aiSourceNote: 'AI triage unavailable — deterministic emergency rules applied.',
      timeline: [
        {
          id: `tl-${Date.now()}-1`,
          timestamp: createdAt,
          action: 'Incident Reported',
          actor: payload.contactName ? `${payload.contactName} (Citizen)` : 'Citizen Report',
          details: `Emergency report submitted for ${payload.emergencyType} at ${payload.location}. People affected: ${payload.peopleAffected}.`,
        },
        {
          id: `tl-${Date.now()}-2`,
          timestamp: new Date().toISOString(),
          action: 'AI Triage Completed',
          actor: 'CivicSOS Neural Triage System',
          details: `Assigned ${aiResult.priority}. Category: ${aiResult.aiCategory}. Recommended Team: ${aiResult.suggestedResponseTeam}.`,
        },
      ],
    };

    const current = getLocalIncidents();
    const updated = [newIncident, ...current.filter((i) => i.id !== newIncident.id)];
    saveLocalIncidents(updated);
    return newIncident;
  },

  async updateIncident(
    id: string,
    updates: Partial<Incident> & { actorName?: string; note?: string }
  ): Promise<Incident | null> {
    const current = getLocalIncidents();
    const existingIndex = current.findIndex((i) => i.id === id);
    if (existingIndex === -1) return null;

    const existing = current[existingIndex];
    const timestamp = new Date().toISOString();
    const actor = updates.actorName || 'Dispatch Officer';

    const newTimelineEntries: TimelineEntry[] = [...existing.timeline];

    if (updates.assignedResponder && updates.assignedResponder !== existing.assignedResponder) {
      newTimelineEntries.push({
        id: `tl-${Date.now()}-assign`,
        timestamp,
        action: 'Responder Assigned',
        actor,
        details: `Incident assigned to ${updates.assignedResponder}${updates.assignedResponderRole ? ` (${updates.assignedResponderRole})` : ''}.`,
      });
    }

    if (updates.status && updates.status !== existing.status) {
      let action = `Status Changed to ${updates.status}`;
      if (updates.status === 'In Progress') {
        action = 'Response Started';
      } else if (updates.status === 'Resolved') {
        action = 'Incident Resolved';
      }

      let details = updates.note || `Incident progressed to ${updates.status}.`;
      if (updates.status === 'Resolved' && updates.resolutionNotes) {
        details = `Resolution recorded: "${updates.resolutionNotes}"`;
      }

      newTimelineEntries.push({
        id: `tl-${Date.now()}-status`,
        timestamp,
        action,
        actor,
        details,
      });
    }

    if (updates.resolutionNotes && updates.resolutionNotes !== existing.resolutionNotes && updates.status !== 'Resolved') {
      newTimelineEntries.push({
        id: `tl-${Date.now()}-notes`,
        timestamp,
        action: 'Resolution Added',
        actor,
        details: `Operational notes: "${updates.resolutionNotes}"`,
      });
    }

    const updatedIncident: Incident = {
      ...existing,
      ...updates,
      timeline: newTimelineEntries,
    };

    if (updates.status === 'In Progress' && !updatedIncident.assignedAt) {
      updatedIncident.assignedAt = timestamp;
    }

    if (updates.status === 'Resolved' && !updatedIncident.resolvedAt) {
      updatedIncident.resolvedAt = timestamp;
    }

    // Attempt server update
    try {
      fetch(`/api/incidents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedIncident),
      }).catch(() => {});
    } catch {
      // Ignore network errors
    }

    current[existingIndex] = updatedIncident;
    saveLocalIncidents(current);
    return updatedIncident;
  },

  async resetToDemoData(): Promise<Incident[]> {
    try {
      await fetch('/api/incidents/reset', { method: 'POST' }).catch(() => {});
    } catch {
      // Ignore
    }
    saveLocalIncidents(INITIAL_SAMPLE_INCIDENTS);
    return INITIAL_SAMPLE_INCIDENTS;
  },

  subscribe(callback: (incidents: Incident[]) => void): () => void {
    const handleCustom = (e: Event) => {
      const custom = e as CustomEvent<Incident[]>;
      if (custom.detail) {
        callback(custom.detail);
      } else {
        callback(getLocalIncidents());
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        callback(getLocalIncidents());
      }
    };

    window.addEventListener(INCIDENT_EVENT, handleCustom);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(INCIDENT_EVENT, handleCustom);
      window.removeEventListener('storage', handleStorage);
    };
  },
};
