import { Responder } from '../types/incident.ts';

export const SAMPLE_RESPONDERS: Responder[] = [
  {
    id: 'RESP-01',
    name: 'Capt. Elena Vance',
    role: 'Lead Paramedic & Trauma Specialist',
    availability: 'Available',
    badgeNumber: 'EMS-402',
    department: 'Metropolitan Emergency Medical Services',
    phone: '+1 (555) 234-8901',
  },
  {
    id: 'RESP-02',
    name: 'Lt. Marcus Chen',
    role: 'Fire & Hazmat Suppression Lead',
    availability: 'Available',
    badgeNumber: 'FD-118',
    department: 'Station 14 Fire & Rescue',
    phone: '+1 (555) 345-6712',
  },
  {
    id: 'RESP-03',
    name: 'Officer Sarah Jenkins',
    role: 'Traffic & Rapid Tactical Responder',
    availability: 'On Scene',
    badgeNumber: 'PD-882',
    department: 'Highway & Urban Safety Patrol',
    phone: '+1 (555) 456-7890',
  },
  {
    id: 'RESP-04',
    name: 'Eng. David Morales',
    role: 'Infrastructure & Electrical Safety Officer',
    availability: 'Available',
    badgeNumber: 'UTIL-09',
    department: 'Civic Power & Water Utility Board',
    phone: '+1 (555) 567-8901',
  },
  {
    id: 'RESP-05',
    name: 'Dr. Aisha Patel',
    role: 'Disaster Triage & Search Coordinator',
    availability: 'Available',
    badgeNumber: 'SAR-205',
    department: 'Civic Search & Disaster Relief Team',
    phone: '+1 (555) 678-9012',
  },
];
