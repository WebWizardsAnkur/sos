import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  MapPin,
  Clock,
  Users,
  AlertTriangle,
  Sparkles,
  UserCheck,
  CheckCircle2,
  Phone,
  User,
  History,
  Send,
  Loader2,
  ArrowRight,
  RotateCcw,
  Lightbulb,
  Radio,
  BadgeAlert,
  Check,
} from 'lucide-react';
import { Incident, IncidentStatus, PriorityLevel, Responder } from '../types/incident.ts';
import { SAMPLE_RESPONDERS } from '../data/responders.ts';

interface IncidentDetailsModalProps {
  incident: Incident;
  onClose: () => void;
  onUpdateIncident: (
    id: string,
    updates: Partial<Incident> & { actorName?: string; note?: string }
  ) => Promise<void>;
  currentActorName: string;
}

export const IncidentDetailsModal: React.FC<IncidentDetailsModalProps> = ({
  incident,
  onClose,
  onUpdateIncident,
  currentActorName,
}) => {
  // Find appropriate default responder matching incident category or first available
  const recommendedTeam = incident.suggestedResponseTeam || incident.recommendedResponse?.suggestedTeam || '';

  const initialResponderId = () => {
    if (incident.assignedResponder) {
      const match = SAMPLE_RESPONDERS.find((r) => r.name === incident.assignedResponder);
      if (match) return match.id;
    }
    const matchingSpec = SAMPLE_RESPONDERS.find(
      (r) => r.specialization === recommendedTeam && r.availability === 'Available'
    );
    if (matchingSpec) return matchingSpec.id;
    const firstAvail = SAMPLE_RESPONDERS.find((r) => r.availability === 'Available');
    return firstAvail ? firstAvail.id : SAMPLE_RESPONDERS[0].id;
  };

  const [selectedResponderId, setSelectedResponderId] = useState<string>(initialResponderId);
  const [allowUnavailableOverride, setAllowUnavailableOverride] = useState<boolean>(false);
  const [resolutionNotes, setResolutionNotes] = useState<string>(incident.resolutionNotes || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const selectedResponder = SAMPLE_RESPONDERS.find((r) => r.id === selectedResponderId) || SAMPLE_RESPONDERS[0];
  const isSelectedUnavailable = selectedResponder.availability !== 'Available';

  // Status badge styling
  const getStatusBadge = (status: IncidentStatus) => {
    switch (status) {
      case 'New':
        return 'bg-sky-950/90 text-sky-300 border-sky-800 font-bold';
      case 'Assigned':
        return 'bg-amber-950/90 text-amber-300 border-amber-800 font-bold';
      case 'In Progress':
        return 'bg-blue-950/90 text-blue-300 border-blue-800 font-bold';
      case 'Resolved':
        return 'bg-emerald-950/90 text-emerald-300 border-emerald-800 font-bold';
    }
  };

  const getPriorityBadge = (priority: PriorityLevel) => {
    switch (priority) {
      case 'P1 - Critical':
        return 'bg-rose-950/90 text-rose-300 border-rose-800 font-bold ring-1 ring-rose-500/50';
      case 'P2 - High':
        return 'bg-amber-950/90 text-amber-300 border-amber-800 font-bold ring-1 ring-amber-500/50';
      case 'P3 - Medium':
        return 'bg-blue-950/90 text-blue-300 border-blue-800';
      case 'P4 - Low':
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  // Assign responder action (Enforces Section 6: checks availability)
  const handleAssignResponder = async () => {
    if (isSelectedUnavailable && !allowUnavailableOverride) {
      setErrorMsg(`Unit ${selectedResponder.name} is currently "${selectedResponder.availability}". Check "Override and assign unavailable unit" to proceed.`);
      return;
    }

    setIsUpdating(true);
    setErrorMsg('');
    try {
      const timestamp = new Date().toISOString();
      const updates: Partial<Incident> & { actorName?: string; note?: string } = {
        assignedResponder: selectedResponder.name,
        assignedResponderRole: selectedResponder.role,
        assignedResponderSpecialization: selectedResponder.specialization,
        assignedAt: timestamp,
        actorName: currentActorName,
      };

      // If current status is New, advance workflow to Assigned
      if (incident.status === 'New') {
        updates.status = 'Assigned';
      }

      await onUpdateIncident(incident.id, updates);
    } catch {
      setErrorMsg('Failed to assign responder. Please retry.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Move status to In Progress (Response Started)
  const handleMoveToInProgress = async () => {
    if (!incident.assignedResponder) {
      setErrorMsg('Please assign a tactical response unit before starting on-scene operations.');
      return;
    }

    setIsUpdating(true);
    setErrorMsg('');
    try {
      await onUpdateIncident(incident.id, {
        status: 'In Progress',
        actorName: currentActorName,
        note: `Response unit ${incident.assignedResponder} arrived on scene. Operational mitigations underway.`,
      });
    } catch {
      setErrorMsg('Failed to update status to In Progress.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Finalize resolution (Enforces Section 5: In Progress -> Resolved with mandatory notes)
  const handleResolveIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionNotes.trim()) {
      setErrorMsg('Resolution notes are required to document field outcomes before closing.');
      return;
    }

    setIsUpdating(true);
    setErrorMsg('');
    try {
      await onUpdateIncident(incident.id, {
        status: 'Resolved',
        resolutionNotes: resolutionNotes.trim(),
        resolvedAt: new Date().toISOString(),
        actorName: currentActorName,
      });
      setShowResolveForm(false);
    } catch {
      setErrorMsg('Failed to resolve incident. Please retry.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Reopen incident if needed (Administrative override)
  const handleReopenIncident = async () => {
    setIsUpdating(true);
    setErrorMsg('');
    try {
      await onUpdateIncident(incident.id, {
        status: 'In Progress',
        actorName: currentActorName,
        note: 'Incident reopened for secondary inspection or continued operations.',
      });
    } catch {
      setErrorMsg('Failed to reopen incident.');
    } finally {
      setIsUpdating(false);
    }
  };

  const formattedReportTime = new Date(incident.createdAt).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-4xl w-full my-6 overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-lg font-bold text-white tracking-wider">
              {incident.id}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded text-xs font-bold border uppercase tracking-wider ${getStatusBadge(
                incident.status
              )}`}
            >
              {incident.status}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded text-xs font-bold border ${getPriorityBadge(
                incident.priority
              )}`}
            >
              {incident.priority}
            </span>
            {incident.isSample && (
              <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                SAMPLE RECORD
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {errorMsg && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-200 text-xs rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Workflow Progress Tracker (Enforces Section 5: NEW -> ASSIGNED -> IN PROGRESS -> RESOLVED) */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
              <span className="uppercase tracking-wider">Operational Lifecycle State Machine</span>
              <span className="text-sky-300 font-bold">Current Phase: {incident.status}</span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'New', desc: 'Assignable' },
                { label: 'Assigned', desc: 'Unit Alerted' },
                { label: 'In Progress', desc: 'On Scene' },
                { label: 'Resolved', desc: 'Mitigated' },
              ].map((step, idx) => {
                const steps: IncidentStatus[] = ['New', 'Assigned', 'In Progress', 'Resolved'];
                const currentIdx = steps.indexOf(incident.status);
                const isPassed = currentIdx >= idx;
                const isCurrent = currentIdx === idx;

                return (
                  <div
                    key={step.label}
                    className={`p-2 rounded border text-center transition-all ${
                      isCurrent
                        ? 'bg-sky-950/80 border-sky-500 text-sky-200 ring-1 ring-sky-500'
                        : isPassed
                        ? 'bg-slate-900 border-slate-700 text-slate-300'
                        : 'bg-slate-950 border-slate-800 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      {isPassed && idx < currentIdx ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <span className="font-mono text-[11px] font-bold">0{idx + 1}</span>
                      )}
                      <span className="font-bold text-xs">{step.label}</span>
                    </div>
                    <span className="text-[10px] block opacity-70">{step.desc}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grid Layout: Column 1 (Citizen Details & Audit) vs Column 2 (AI Intelligence & Response Controls) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Column 1: Citizen Incident Report & Assigned Personnel */}
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Citizen Incident Report
                </h3>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Emergency Type</span>
                    <span className="font-bold text-white text-sm flex items-center gap-1.5 mt-0.5">
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                      {incident.emergencyType}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Reported Severity</span>
                    <span className="font-bold text-rose-300 text-sm mt-0.5 block">
                      {incident.severity}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Reported Timestamp</span>
                    <span className="font-medium text-slate-200 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {formattedReportTime}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">People Affected</span>
                    <span className="font-medium text-slate-200 flex items-center gap-1 mt-0.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {incident.peopleAffected} Person(s)
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-[11px] text-slate-400 block mb-0.5">Incident Location</span>
                  <div className="flex items-start gap-1.5 text-xs text-slate-200 font-medium">
                    <MapPin className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                    <span>{incident.location}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-[11px] text-slate-400 block mb-1">Citizen Narrative</span>
                  <p className="text-xs text-slate-200 leading-relaxed bg-slate-900 p-2.5 rounded border border-slate-800">
                    {incident.description}
                  </p>
                </div>

                {(incident.contactName || incident.contactNumber) && (
                  <div className="pt-2 border-t border-slate-800/80 flex items-center gap-4 text-xs text-slate-300">
                    {incident.contactName && (
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{incident.contactName}</span>
                      </span>
                    )}
                    {incident.contactNumber && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{incident.contactNumber}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Resolution Details Section (When Resolved) */}
              {incident.status === 'Resolved' && (
                <div className="bg-emerald-950/40 p-4 rounded-xl border border-emerald-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-emerald-300 uppercase flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Final Resolution Record
                    </span>
                    {incident.resolvedAt && (
                      <span className="text-[10px] text-emerald-400 font-mono">
                        {new Date(incident.resolvedAt).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-emerald-100 bg-emerald-950/60 p-3 rounded border border-emerald-900/60 leading-relaxed">
                    {incident.resolutionNotes || 'Incident successfully mitigated and closed.'}
                  </p>
                  <button
                    onClick={handleReopenIncident}
                    disabled={isUpdating}
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 pt-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Administrative Reopen for Follow-up</span>
                  </button>
                </div>
              )}
            </div>

            {/* Column 2: AI Intelligence & Tactical Dispatch Controls */}
            <div className="space-y-4">
              {/* SECTION 2 & 3: AI PRIORITY EXPLANATION & RISK FACTORS */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                      AI Triage & Priority Analysis
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700">
                    {incident.aiSource === 'gemini' ? 'Gemini 3.8 Flash' : 'Deterministic Rules'}
                  </span>
                </div>

                {/* Priority Banner with Structured Why and Risk Factors (Section 3 requirement) */}
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                      {incident.priority}
                    </span>
                    <span className="text-[11px] text-slate-400 font-semibold">
                      {incident.aiCategory}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-mono font-bold text-slate-300 uppercase block mb-0.5">
                      Why:
                    </span>
                    <p className="text-xs text-slate-200 leading-relaxed italic bg-slate-950/80 p-2 rounded border border-slate-800">
                      {incident.priorityReason}
                    </p>
                  </div>

                  {incident.keyRiskFactors && incident.keyRiskFactors.length > 0 && (
                    <div>
                      <span className="text-[11px] font-mono font-bold text-slate-300 uppercase block mb-1">
                        Risk factors:
                      </span>
                      <ul className="space-y-0.5">
                        {incident.keyRiskFactors.map((factor, i) => (
                          <li key={i} className="text-xs text-rose-300 flex items-start gap-1.5">
                            <span className="text-rose-400 font-bold">•</span>
                            <span>{factor}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* SECTION 2: AI RESPONSE RECOMMENDATION */}
                {incident.recommendedResponse && (
                  <div className="p-3.5 bg-gradient-to-r from-sky-950/70 to-slate-950 border border-sky-800/80 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Lightbulb className="w-4 h-4 text-sky-400" />
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-sky-200">
                          AI Response Recommendation
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-400 italic">
                        AI-Assisted Guidance
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div>
                        <span className="text-slate-400 block font-semibold text-[11px]">Immediate action:</span>
                        <p className="text-white font-medium leading-relaxed">
                          {incident.recommendedResponse.immediateAction}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-sky-900/40 text-[11px]">
                        <div>
                          <span className="text-slate-400 block">Suggested team:</span>
                          <span className="text-emerald-300 font-bold">
                            {incident.recommendedResponse.suggestedTeam}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Risk consideration:</span>
                          <span className="text-amber-200 font-medium">
                            {incident.recommendedResponse.riskConsideration}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 6: RESPONDER ASSIGNMENT & LIFECYCLE DISPATCH */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                    Responder Assignment & Deployment
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Target Team: {recommendedTeam}
                  </span>
                </div>

                {/* Currently Assigned Responder Card (Section 6: show name, role, time) */}
                <div className="text-xs bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-slate-400 block text-[11px]">Assigned Incident Commander</span>
                  {incident.assignedResponder ? (
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-sm text-emerald-400">
                          <UserCheck className="w-4 h-4" />
                          <span>{incident.assignedResponder}</span>
                        </div>
                        {incident.assignedResponderSpecialization && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                            {incident.assignedResponderSpecialization}
                          </span>
                        )}
                      </div>
                      {incident.assignedResponderRole && (
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {incident.assignedResponderRole}
                        </span>
                      )}
                      {incident.assignedAt && (
                        <span className="text-[10px] text-slate-500 font-mono block mt-1">
                          Assigned at: {new Date(incident.assignedAt).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-amber-400 font-semibold italic block py-1">
                      No Tactical Unit Assigned Yet
                    </span>
                  )}
                </div>

                {/* Assign / Reassign Selector with Category Filtering (Section 6) */}
                {incident.status !== 'Resolved' && (
                  <div className="space-y-2">
                    <label className="text-[11px] text-slate-400 block">
                      Select Unit (Categorized by Specialization & Availability):
                    </label>
                    <select
                      value={selectedResponderId}
                      onChange={(e) => {
                        setSelectedResponderId(e.target.value);
                        setErrorMsg('');
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                    >
                      {SAMPLE_RESPONDERS.map((r) => {
                        const isMatch = r.specialization === recommendedTeam;
                        return (
                          <option key={r.id} value={r.id}>
                            {r.name} — {r.specialization} [{r.availability}] {isMatch ? '★ RECOMMENDED' : ''}
                          </option>
                        );
                      })}
                    </select>

                    {/* Unit Availability Notice & Override Checkbox */}
                    {isSelectedUnavailable && (
                      <div className="p-2.5 rounded bg-amber-950/60 border border-amber-800/80 text-amber-200 text-xs space-y-1.5">
                        <div className="flex items-center gap-1.5 font-semibold text-[11px]">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                          <span>
                            Notice: {selectedResponder.name} is currently marked as "{selectedResponder.availability}".
                          </span>
                        </div>
                        <label className="flex items-center gap-2 text-[11px] text-amber-300 cursor-pointer pt-0.5">
                          <input
                            type="checkbox"
                            checked={allowUnavailableOverride}
                            onChange={(e) => setAllowUnavailableOverride(e.target.checked)}
                            className="rounded bg-slate-900 border-amber-700 text-amber-500 focus:ring-0"
                          />
                          <span>Override availability and assign this unit anyway</span>
                        </label>
                      </div>
                    )}

                    <button
                      onClick={handleAssignResponder}
                      disabled={isUpdating}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                    >
                      {isUpdating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <UserCheck className="w-4 h-4 text-sky-400" />
                          <span>
                            {incident.assignedResponder ? 'Reassign Selected Unit' : 'Assign & Deploy Unit'}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Workflow Progression Action Controls (Section 5) */}
                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <span className="text-[11px] text-slate-400 block font-mono">
                    Workflow State Progression:
                  </span>

                  {/* If Assigned -> Start Response / Move to In Progress */}
                  {incident.status === 'Assigned' && (
                    <button
                      onClick={handleMoveToInProgress}
                      disabled={isUpdating}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors cursor-pointer shadow-md"
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span>Confirm Arrival On Scene → Set "In Progress"</span>
                    </button>
                  )}

                  {/* If In Progress -> Resolve with Notes */}
                  {incident.status === 'In Progress' && !showResolveForm && (
                    <button
                      onClick={() => setShowResolveForm(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors cursor-pointer shadow-md"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Document Resolution & Neutralize Incident</span>
                    </button>
                  )}

                  {/* If Resolved -> Read-only message */}
                  {incident.status === 'Resolved' && (
                    <div className="p-2.5 bg-slate-900 rounded border border-emerald-900/60 text-xs text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>This incident is fully resolved and locked for operational audits.</span>
                    </div>
                  )}

                  {/* Resolution Form */}
                  {showResolveForm && incident.status === 'In Progress' && (
                    <form
                      onSubmit={handleResolveIncident}
                      className="bg-slate-900 p-3 rounded-lg border border-emerald-600/60 space-y-3"
                    >
                      <label className="text-xs font-bold text-white block">
                        Record Operational Resolution Notes <span className="text-rose-400">*</span>
                      </label>
                      <textarea
                        rows={3}
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        placeholder="Detail the tactical outcome: e.g. Patient stabilized and transferred to City Hospital; gas line isolated and air verified safe."
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={isUpdating}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
                        >
                          {isUpdating ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Confirm Resolution</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowResolveForm(false)}
                          className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: COMPREHENSIVE INCIDENT TIMELINE */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                  Complete Operational Audit Timeline ({incident.timeline.length} Events)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-500">Immutable Audit Trail</span>
            </div>

            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {incident.timeline.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 text-xs border-l-2 border-slate-700 pl-3 py-1 relative"
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-[11px] mb-0.5">
                      <span className="font-bold text-slate-100 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                        {entry.action}
                      </span>
                      <span className="text-slate-400 font-mono text-[10px]">
                        {new Date(entry.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                    </div>
                    <span className="text-[10px] text-sky-400 block mb-0.5 font-medium">
                      Actor: {entry.actor}
                    </span>
                    {entry.details && (
                      <p className="text-slate-300 text-[11px] leading-snug">{entry.details}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 flex-shrink-0">
          <span>CivicSOS Operational Dispatcher: {currentActorName}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors cursor-pointer"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
