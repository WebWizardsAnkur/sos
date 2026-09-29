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

export type ResponderSpecialization =
  | 'Medical Response'
  | 'Fire & Rescue'
  | 'Police / Public Safety'
  | 'Disaster Response'
  | 'Infrastructure Response'
  | 'General Operations';

export interface TimelineEntry {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  details?: string;
}

export interface AIRecommendedResponse {
  immediateAction: string;
  suggestedTeam: string;
  riskConsideration: string;
}

export type IncidentSubmissionData = {
  emergencyType: EmergencyType;
  severity: SeverityLevel;
  location: string;
  peopleAffected: number;
  description: string;
  contactName?: string;
  contactNumber?: string;
};

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
  keyRiskFactors: string[];
  recommendedResponse: AIRecommendedResponse;
  suggestedResponseTeam: string;
  status: IncidentStatus;
  assignedResponder: string | null;
  assignedResponderRole?: string;
  assignedResponderSpecialization?: string;
  assignedAt: string | null;
  resolvedAt: string | null;
  resolutionNotes: string | null;
  isSample?: boolean;
  timeline: TimelineEntry[];
  aiSource?: 'gemini' | 'rule-engine';
  aiSourceNote?: string;
}

export interface Responder {
  id: string;
  name: string;
  role: string;
  specialization: ResponderSpecialization;
  availability: 'Available' | 'On Scene' | 'Off Duty';
  badgeNumber: string;
  department: string;
  phone: string;
}

export interface AIAnalysisResult {
  aiCategory: string;
  priority: PriorityLevel;
  priorityReason: string;
  keyRiskFactors: string[];
  recommendedResponse: AIRecommendedResponse;
  suggestedResponseTeam: string;
  source: 'gemini' | 'rule-engine';
  sourceNote?: string;
}
