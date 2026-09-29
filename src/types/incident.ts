export type EmergencyType =
  | 'Medical'
  | 'Fire'
  | 'Accident'
  | 'Flood'
  | 'Infrastructure'
  | 'Other';

export type SeverityLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export type PriorityLevel =
  | 'P1 - Critical'
  | 'P2 - High'
  | 'P3 - Medium'
  | 'P4 - Low';

export type IncidentStatus = 'New' | 'Assigned' | 'In Progress' | 'Resolved';

export interface TimelineEntry {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  details?: string;
}

export interface Incident {
  id: string;
  createdAt: string;
  emergencyType: EmergencyType;
  severity: SeverityLevel;
  location: string;
  peopleAffected: number;
  description: string;
  contactName?: string;
  contactNumber?: string;
  aiCategory: string;
  priority: PriorityLevel;
  priorityReason: string;
  status: IncidentStatus;
  assignedResponder: string | null;
  assignedResponderRole?: string;
  assignedAt: string | null;
  resolvedAt: string | null;
  resolutionNotes: string | null;
  isSample?: boolean;
  timeline: TimelineEntry[];
  aiSource?: 'gemini' | 'rule-engine';
}

export interface Responder {
  id: string;
  name: string;
  role: string;
  availability: 'Available' | 'On Scene' | 'Off Duty';
  badgeNumber: string;
  department: string;
  phone: string;
}

export interface AIAnalysisResult {
  aiCategory: string;
  priority: PriorityLevel;
  priorityReason: string;
  source: 'gemini' | 'rule-engine';
}
