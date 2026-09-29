import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import {
  Incident,
  PriorityLevel,
  TimelineEntry,
  AIAnalysisResult,
  EmergencyType,
  SeverityLevel,
} from './src/types/incident.ts';
import { INITIAL_SAMPLE_INCIDENTS } from './src/data/sampleIncidents.ts';
import { runDeterministicClassification } from './src/services/aiClassifier.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Persistent File Storage Path
const DATA_DIR = path.resolve(__dirname, 'data');
const INCIDENTS_FILE = path.resolve(DATA_DIR, 'incidents.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.warn('Could not create data directory:', err);
  }
}

// Persistent storage helpers
function loadIncidentsFromDisk(): Incident[] {
  try {
    if (fs.existsSync(INCIDENTS_FILE)) {
      const raw = fs.readFileSync(INCIDENTS_FILE, 'utf-8');
      if (raw && raw.trim().length > 0) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }
  } catch (err) {
    console.warn('Error reading incidents from disk, initializing fresh:', err);
  }

  // Initialize with initial sample incidents
  saveIncidentsToDisk(INITIAL_SAMPLE_INCIDENTS);
  return [...INITIAL_SAMPLE_INCIDENTS];
}

function saveIncidentsToDisk(incidents: Incident[]): void {
  try {
    fs.writeFileSync(INCIDENTS_FILE, JSON.stringify(incidents, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing incidents to disk:', err);
  }
}

// In-memory incidents cache backed by disk
let incidentsStore: Incident[] = loadIncidentsFromDisk();

// Initialize Gemini SDK if API key exists
const apiKey = process.env.GEMINI_API_KEY || '';
let aiClient: GoogleGenAI | null = null;
if (apiKey) {
  try {
    aiClient = new GoogleGenAI({ apiKey });
  } catch (err) {
    console.warn('Failed to initialize GoogleGenAI client:', err);
  }
}

const VALID_PRIORITIES: PriorityLevel[] = [
  'P1 - Critical',
  'P2 - High',
  'P3 - Medium',
  'P4 - Low',
];

// Enhanced AI Triage with Gemini 3.8 Flash and strict validation
async function analyzeIncidentWithAI(
  emergencyType: EmergencyType,
  severity: SeverityLevel,
  peopleAffected: number,
  description: string,
  location?: string
): Promise<AIAnalysisResult> {
  if (aiClient) {
    try {
      const prompt = `You are the lead AI Triage Officer for CivicSOS, an emergency incident reporting and response coordination platform.
Analyze the following citizen emergency report and produce operational triage guidance.

Emergency Type: ${emergencyType}
Reported Severity: ${severity}
People Affected: ${peopleAffected}
Incident Location: "${location || 'Unspecified location'}"
Incident Description: "${description}"

Evaluate the operational risks, casualty threat, and immediate response needs.
Return a valid JSON object matching this schema:
{
  "aiCategory": "precise operational category, e.g. 'Acute Life-Threat / Critical Resuscitation', 'Structural Fire Hazard', 'Multi-Vehicle Collision', 'Flash Flood Water Rescue', 'Hazardous Gas Pipeline Rupture'",
  "priority": "P1 - Critical" | "P2 - High" | "P3 - Medium" | "P4 - Low",
  "priorityReason": "Concise operational reason explaining why this priority was assigned (e.g. 'Reported life-threatening cardiac arrest symptoms with unresponsive victim in dense transit hub.')",
  "keyRiskFactors": ["Concise risk factor 1", "Concise risk factor 2", "Concise risk factor 3"],
  "recommendedResponse": {
    "immediateAction": "Direct actionable directive for responders (e.g. 'Dispatch ALS paramedic crew immediately; prioritize airway management and AED.')",
    "suggestedTeam": "Specialized team, e.g. 'Medical Response', 'Fire & Rescue', 'Police / Public Safety', 'Disaster Response', 'Infrastructure Response'",
    "riskConsideration": "Crucial risk consideration (e.g. 'Irreversible cerebral hypoxia within 4 minutes without continuous resuscitation.')"
  },
  "suggestedResponseTeam": "Medical Response" | "Fire & Rescue" | "Police / Public Safety" | "Disaster Response" | "Infrastructure Response" | "General Operations"
}

Respond ONLY with valid JSON. Do not include markdown code block backticks.`;

      const response = await Promise.race([
        aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('AI triage timed out')), 3500)
        ),
      ]);

      const text = response.text?.trim() || '';
      if (text) {
        // Strip any markdown fences if present
        const cleaned = text.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
        const parsed = JSON.parse(cleaned);

        // Strict validation
        if (
          parsed &&
          typeof parsed === 'object' &&
          VALID_PRIORITIES.includes(parsed.priority) &&
          typeof parsed.aiCategory === 'string' &&
          typeof parsed.priorityReason === 'string' &&
          parsed.recommendedResponse &&
          typeof parsed.recommendedResponse.immediateAction === 'string'
        ) {
          const riskFactors: string[] = Array.isArray(parsed.keyRiskFactors) && parsed.keyRiskFactors.length > 0
            ? parsed.keyRiskFactors.filter((r: unknown) => typeof r === 'string' && r.trim().length > 0)
            : ['Immediate life-safety evaluation required'];

          return {
            aiCategory: parsed.aiCategory,
            priority: parsed.priority,
            priorityReason: parsed.priorityReason,
            keyRiskFactors: riskFactors.slice(0, 4),
            recommendedResponse: {
              immediateAction: parsed.recommendedResponse.immediateAction,
              suggestedTeam: parsed.recommendedResponse.suggestedTeam || parsed.suggestedResponseTeam || 'General Operations',
              riskConsideration: parsed.recommendedResponse.riskConsideration || 'Continuous hazard monitoring required.',
            },
            suggestedResponseTeam: parsed.suggestedResponseTeam || parsed.recommendedResponse.suggestedTeam || 'General Operations',
            source: 'gemini',
          };
        }
      }
    } catch (aiErr) {
      console.warn('Gemini AI triage fallback triggered:', aiErr instanceof Error ? aiErr.message : aiErr);
    }
  }

  // Deterministic fallback with explicit sourceNote
  const fallback = runDeterministicClassification(
    emergencyType,
    severity,
    peopleAffected,
    description,
    location
  );

  return {
    ...fallback,
    source: 'rule-engine',
    sourceNote: 'AI triage unavailable — deterministic emergency rules applied.',
  };
}

// REST API Endpoints

// GET /api/incidents - List all incidents
app.get('/api/incidents', (req: Request, res: Response) => {
  res.json(incidentsStore);
});

// GET /api/incidents/:id - Get specific incident
app.get('/api/incidents/:id', (req: Request, res: Response) => {
  const incident = incidentsStore.find((i) => i.id === req.params.id);
  if (!incident) {
    res.status(404).json({ error: 'Incident not found' });
    return;
  }
  res.json(incident);
});

// POST /api/incidents - Create new incident
app.post('/api/incidents', async (req: Request, res: Response) => {
  try {
    const {
      id,
      createdAt,
      emergencyType,
      severity,
      location,
      peopleAffected,
      description,
      contactName,
      contactNumber,
    } = req.body;

    if (!emergencyType || !severity || !location || !description) {
      res.status(400).json({ error: 'Missing required incident fields (emergencyType, severity, location, description)' });
      return;
    }

    const incidentId = id || `SOS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const timestamp = createdAt || new Date().toISOString();

    // Run AI Triage
    const aiAnalysis = await analyzeIncidentWithAI(
      emergencyType,
      severity,
      Number(peopleAffected) || 1,
      description,
      location
    );

    const newIncident: Incident = {
      id: incidentId,
      createdAt: timestamp,
      emergencyType,
      severity,
      location,
      peopleAffected: Number(peopleAffected) || 1,
      description,
      contactName: contactName || undefined,
      contactNumber: contactNumber || undefined,
      aiCategory: aiAnalysis.aiCategory,
      priority: aiAnalysis.priority,
      priorityReason: aiAnalysis.priorityReason,
      keyRiskFactors: aiAnalysis.keyRiskFactors,
      recommendedResponse: aiAnalysis.recommendedResponse,
      suggestedResponseTeam: aiAnalysis.suggestedResponseTeam,
      status: 'New',
      assignedResponder: null,
      assignedResponderRole: undefined,
      assignedResponderSpecialization: undefined,
      assignedAt: null,
      resolvedAt: null,
      resolutionNotes: null,
      isSample: false,
      aiSource: aiAnalysis.source,
      aiSourceNote: aiAnalysis.sourceNote,
      timeline: [
        {
          id: `tl-${Date.now()}-1`,
          timestamp,
          action: 'Incident Reported',
          actor: contactName ? `${contactName} (Citizen)` : 'Citizen Report',
          details: `Emergency report submitted for ${emergencyType} at ${location}. People affected: ${peopleAffected}.`,
        },
        {
          id: `tl-${Date.now()}-2`,
          timestamp: new Date().toISOString(),
          action: 'AI Triage Completed',
          actor: aiAnalysis.source === 'gemini' ? 'Gemini 3.8 Flash Triage Engine' : 'CivicSOS Neural Triage System',
          details: `Assigned ${aiAnalysis.priority}. Category: ${aiAnalysis.aiCategory}. Recommended Team: ${aiAnalysis.suggestedResponseTeam}.`,
        },
      ],
    };

    incidentsStore.unshift(newIncident);
    saveIncidentsToDisk(incidentsStore);
    res.status(201).json(newIncident);
  } catch (error) {
    console.error('Error creating incident:', error);
    res.status(500).json({ error: 'Failed to create incident' });
  }
});

// PATCH /api/incidents/:id - Update incident status, assignment, resolution notes
app.patch('/api/incidents/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = incidentsStore.findIndex((i) => i.id === id);
  if (index === -1) {
    res.status(404).json({ error: 'Incident not found' });
    return;
  }

  const existing = incidentsStore[index];
  const updates = req.body;
  const timestamp = new Date().toISOString();
  const actor = updates.actorName || 'Dispatch Officer';

  const newTimeline: TimelineEntry[] = [...(updates.timeline || existing.timeline)];

  // Responder Assigned Event
  if (updates.assignedResponder && updates.assignedResponder !== existing.assignedResponder) {
    newTimeline.push({
      id: `tl-${Date.now()}-assign`,
      timestamp,
      action: 'Responder Assigned',
      actor,
      details: `Incident assigned to ${updates.assignedResponder}${updates.assignedResponderRole ? ` (${updates.assignedResponderRole})` : ''}.`,
    });
  }

  // Status Change Event
  if (updates.status && updates.status !== existing.status) {
    let actionName = `Status Changed to ${updates.status}`;
    if (updates.status === 'In Progress') {
      actionName = 'Response Started';
    } else if (updates.status === 'Resolved') {
      actionName = 'Incident Resolved';
    }

    let detailText = updates.note || `Incident progressed to ${updates.status}.`;
    if (updates.status === 'Resolved' && updates.resolutionNotes) {
      detailText = `Resolution recorded: "${updates.resolutionNotes}"`;
    }

    newTimeline.push({
      id: `tl-${Date.now()}-status`,
      timestamp,
      action: actionName,
      actor,
      details: detailText,
    });
  }

  // Resolution Notes added independently
  if (updates.resolutionNotes && updates.resolutionNotes !== existing.resolutionNotes && updates.status !== 'Resolved') {
    newTimeline.push({
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
    timeline: newTimeline,
  };

  // Enforce timestamps
  if (updates.status === 'In Progress' && !updatedIncident.assignedAt) {
    updatedIncident.assignedAt = timestamp;
  }

  if (updates.status === 'Resolved' && !updatedIncident.resolvedAt) {
    updatedIncident.resolvedAt = timestamp;
  }

  incidentsStore[index] = updatedIncident;
  saveIncidentsToDisk(incidentsStore);
  res.json(updatedIncident);
});

// POST /api/incidents/reset - Reset to default sample incidents
app.post('/api/incidents/reset', (req: Request, res: Response) => {
  incidentsStore = [...INITIAL_SAMPLE_INCIDENTS];
  saveIncidentsToDisk(incidentsStore);
  res.json({ message: 'Reset to demo incidents successfully', count: incidentsStore.length });
});

// Vite Middleware for Frontend Integration
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CivicSOS server running on http://0.0.0.0:${PORT} with persistent storage at ${INCIDENTS_FILE}`);
  });
}

startServer();
