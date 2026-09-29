import { Incident, IncidentStatus } from '../types/incident.ts';
import { INITIAL_SAMPLE_INCIDENTS } from '../data/sampleIncidents.ts';
import { runDeterministicClassification } from './aiClassifier.ts';

const STORAGE_KEY = 'civicsos_incidents_v1';
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
      // Offline or network error - use localStorage
    }
    return getLocalIncidents();
  },

  async getIncidentById(id: string): Promise<Incident | null> {
    const all = await this.getAllIncidents();
    return all.find((inc) => inc.id === id) || null;
  },

  async createIncident(
    payload: Omit<
      Incident,
      | 'id'
      | 'createdAt'
      | 'status'
      | 'assignedResponder'
      | 'assignedResponderRole'
      | 'assignedAt'
      | 'resolvedAt'
      | 'resolutionNotes'
      | 'timeline'
      | 'aiCategory'
      | 'priority'
      | 'priorityReason'
      | 'aiSource'
    >
  ): Promise<Incident> {
    // Generate unique incident ID
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const incidentId = `SOS-${new Date().getFullYear()}-${randomSuffix}`;
    const createdAt = new Date().toISOString();

    // 1. Try server-side AI triage via /api/incidents
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
        const saved = await res.json();
        // Update local storage
        const current = getLocalIncidents();
        const updated = [saved, ...current.filter((i) => i.id !== saved.id)];
        saveLocalIncidents(updated);
        return saved;
      }
    } catch {
      // Backend not reached, fall through to client-side fallback
    }

    // 2. Client-side deterministic classification fallback
    const aiResult = runDeterministicClassification(
      payload.emergencyType,
      payload.severity,
      payload.peopleAffected,
      payload.description
    );

    const newIncident: Incident = {
      ...payload,
      id: incidentId,
      createdAt,
      aiCategory: aiResult.aiCategory,
      priority: aiResult.priority,
      priorityReason: aiResult.priorityReason,
      status: 'New',
      assignedResponder: null,
      assignedAt: null,
      resolvedAt: null,
      resolutionNotes: null,
      isSample: false,
      aiSource: 'rule-engine',
      timeline: [
        {
          id: `tl-${Date.now()}-1`,
          timestamp: createdAt,
          action: 'Emergency Incident Reported',
          actor: payload.contactName ? `${payload.contactName} (Citizen)` : 'Citizen Report',
          details: `Emergency report submitted for ${payload.emergencyType} at ${payload.location}. Affected individuals: ${payload.peopleAffected}.`,
        },
        {
          id: `tl-${Date.now()}-2`,
          timestamp: new Date().toISOString(),
          action: 'Automated AI Triage Assessment',
          actor: 'CivicSOS Neural Triage System',
          details: `Classified as ${aiResult.priority}. Category: ${aiResult.aiCategory}. Reason: ${aiResult.priorityReason}`,
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

    // Prepare updated timeline
    const newTimelineEntries = [...existing.timeline];

    if (updates.assignedResponder && updates.assignedResponder !== existing.assignedResponder) {
      newTimelineEntries.push({
        id: `tl-${Date.now()}-assign`,
        timestamp,
        action: 'Responder Assigned',
        actor,
        details: `Assigned to ${updates.assignedResponder}${updates.assignedResponderRole ? ` (${updates.assignedResponderRole})` : ''}.`,
      });
    }

    if (updates.status && updates.status !== existing.status) {
      newTimelineEntries.push({
        id: `tl-${Date.now()}-status`,
        timestamp,
        action: `Status Changed to ${updates.status}`,
        actor,
        details: updates.resolutionNotes
          ? `Resolution notes added: "${updates.resolutionNotes}"`
          : updates.note || `Incident progressed to ${updates.status}.`,
      });
    }

    const updatedIncident: Incident = {
      ...existing,
      ...updates,
      timeline: newTimelineEntries,
    };

    // If status changed to In Progress and assignedAt is not set
    if (updates.status === 'In Progress' && !updatedIncident.assignedAt) {
      updatedIncident.assignedAt = timestamp;
    }

    // If status changed to Resolved
    if (updates.status === 'Resolved' && !updatedIncident.resolvedAt) {
      updatedIncident.resolvedAt = timestamp;
    }

    // Try server update
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
