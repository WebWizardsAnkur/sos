import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { Incident, PriorityLevel, TimelineEntry } from './src/types/incident.ts';
import { INITIAL_SAMPLE_INCIDENTS } from './src/data/sampleIncidents.ts';
import { runDeterministicClassification } from './src/services/aiClassifier.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory incidents storage on server
let incidentsStore: Incident[] = [...INITIAL_SAMPLE_INCIDENTS];

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

// AI Classification Function using Gemini 3.8 Flash with reliable fallback
async function analyzeIncidentWithAI(
  emergencyType: string,
  severity: string,
  peopleAffected: number,
  description: string
): Promise<{
  aiCategory: string;
  priority: PriorityLevel;
  priorityReason: string;
  source: 'gemini' | 'rule-engine';
}> {
  if (aiClient) {
    try {
      const prompt = `You are the lead AI Triage Officer for CivicSOS, an emergency coordination system.
Analyze the following citizen emergency report and return a JSON object with triage analysis.

Emergency Type: ${emergencyType}
Reported Severity: ${severity}
People Affected: ${peopleAffected}
Incident Description: "${description}"

Determine:
1. "aiCategory": A precise operational emergency category (e.g. "Acute Life-Threat / Trauma", "Structural Fire Hazard", "Multi-Vehicle Collision", "Flash Flood Water Rescue", "High-Voltage Electrical Hazard", "Public Safety Incident")
2. "priority": EXACTLY one of: "P1 - Critical", "P2 - High", "P3 - Medium", "P4 - Low"
3. "priorityReason": A concise 1-2 sentence emergency dispatch justification explaining why this priority was assigned and immediate operational risk.

Respond ONLY with valid JSON in this format:
{
  "aiCategory": "string",
  "priority": "P1 - Critical" | "P2 - High" | "P3 - Medium" | "P4 - Low",
  "priorityReason": "string"
}`;

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
          setTimeout(() => reject(new Error('AI triage timed out')), 4000)
        ),
      ]);

      const text = response.text?.trim() || '';
      if (text) {
        const parsed = JSON.parse(text);
        const validPriorities: PriorityLevel[] = [
          'P1 - Critical',
          'P2 - High',
          'P3 - Medium',
          'P4 - Low',
        ];
        const priority = validPriorities.includes(parsed.priority)
          ? parsed.priority
          : 'P2 - High';

        return {
          aiCategory: parsed.aiCategory || `${emergencyType} Triage Response`,
          priority,
          priorityReason: parsed.priorityReason || `Prioritized by AI based on reported conditions.`,
          source: 'gemini',
        };
      }
    } catch (aiErr) {
      console.warn('Gemini AI triage fallback triggered:', aiErr instanceof Error ? aiErr.message : aiErr);
    }
  }

  // Deterministic fallback
  return runDeterministicClassification(
    emergencyType as any,
    severity as any,
    peopleAffected,
    description
  );
}

// REST API Endpoints
app.get('/api/incidents', (req: Request, res: Response) => {
  res.json(incidentsStore);
});

app.get('/api/incidents/:id', (req: Request, res: Response) => {
  const incident = incidentsStore.find((i) => i.id === req.params.id);
  if (!incident) {
    res.status(404).json({ error: 'Incident not found' });
    return;
  }
  res.json(incident);
});

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

    const incidentId = id || `SOS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const timestamp = createdAt || new Date().toISOString();

    // Run AI Triage
    const aiAnalysis = await analyzeIncidentWithAI(
      emergencyType,
      severity,
      Number(peopleAffected) || 1,
      description
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
      status: 'New',
      assignedResponder: null,
      assignedAt: null,
      resolvedAt: null,
      resolutionNotes: null,
      isSample: false,
      aiSource: aiAnalysis.source,
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
          action: 'Automated AI Triage Assessment',
          actor: aiAnalysis.source === 'gemini' ? 'Gemini 3.8 Flash Triage Engine' : 'CivicSOS Neural Triage System',
          details: `Assigned ${aiAnalysis.priority}. Category: ${aiAnalysis.aiCategory}. Reason: ${aiAnalysis.priorityReason}`,
        },
      ],
    };

    incidentsStore.unshift(newIncident);
    res.status(201).json(newIncident);
  } catch (error) {
    console.error('Error creating incident:', error);
    res.status(500).json({ error: 'Failed to create incident' });
  }
});

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

  const newTimeline: TimelineEntry[] = [...(updates.timeline || existing.timeline)];

  if (updates.assignedResponder && updates.assignedResponder !== existing.assignedResponder) {
    newTimeline.push({
      id: `tl-${Date.now()}-assign`,
      timestamp,
      action: 'Responder Assigned',
      actor: updates.actorName || 'Dispatch Officer',
      details: `Incident assigned to ${updates.assignedResponder}${updates.assignedResponderRole ? ` (${updates.assignedResponderRole})` : ''}.`,
    });
  }

  if (updates.status && updates.status !== existing.status) {
    newTimeline.push({
      id: `tl-${Date.now()}-status`,
      timestamp,
      action: `Status Changed to ${updates.status}`,
      actor: updates.actorName || 'Dispatch Officer',
      details: updates.resolutionNotes
        ? `Resolution notes added: "${updates.resolutionNotes}"`
        : `Incident transitioned to ${updates.status}.`,
    });
  }

  const updatedIncident: Incident = {
    ...existing,
    ...updates,
    timeline: newTimeline,
  };

  if (updates.status === 'In Progress' && !updatedIncident.assignedAt) {
    updatedIncident.assignedAt = timestamp;
  }

  if (updates.status === 'Resolved' && !updatedIncident.resolvedAt) {
    updatedIncident.resolvedAt = timestamp;
  }

  incidentsStore[index] = updatedIncident;
  res.json(updatedIncident);
});

app.post('/api/incidents/reset', (req: Request, res: Response) => {
  incidentsStore = [...INITIAL_SAMPLE_INCIDENTS];
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
    console.log(`CivicSOS server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
