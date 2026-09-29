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
} from 'lucide-react';
import { Incident, IncidentStatus, PriorityLevel } from '../types/incident.ts';
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
  const [selectedResponderId, setSelectedResponderId] = useState<string>(
    SAMPLE_RESPONDERS.find((r) => r.name === incident.assignedResponder)?.id ||
      SAMPLE_RESPONDERS[0].id
  );
  const [resolutionNotes, setResolutionNotes] = useState<string>(
    incident.resolutionNotes || ''
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Status badge styling
  const getStatusBadge = (status: IncidentStatus) => {
    switch (status) {
      case 'New':
        return 'bg-sky-950/80 text-sky-300 border-sky-800';
      case 'Assigned':
        return 'bg-amber-950/80 text-amber-300 border-amber-800';
      case 'In Progress':
        return 'bg-blue-950/80 text-blue-300 border-blue-800';
      case 'Resolved':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800';
    }
  };

  const getPriorityBadge = (priority: PriorityLevel) => {
    switch (priority) {
      case 'P1 - Critical':
        return 'bg-rose-950 text-rose-300 border-rose-800';
      case 'P2 - High':
        return 'bg-amber-950 text-amber-300 border-amber-800';
      case 'P3 - Medium':
        return 'bg-blue-950 text-blue-300 border-blue-800';
      case 'P4 - Low':
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  // Assign responder action
  const handleAssignResponder = async () => {
    const responder = SAMPLE_RESPONDERS.find((r) => r.id === selectedResponderId);
    if (!responder) return;

    setIsUpdating(true);
    setErrorMsg('');
    try {
      const updates: Partial<Incident> & { actorName?: string; note?: string } = {
        assignedResponder: responder.name,
        assignedResponderRole: responder.role,
        actorName: currentActorName,
      };

      // If current status is New, advance to Assigned
      if (incident.status === 'New') {
        updates.status = 'Assigned';
        updates.assignedAt = new Date().toISOString();
      }

      await onUpdateIncident(incident.id, updates);
    } catch {
      setErrorMsg('Failed to assign responder. Please retry.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Move status to In Progress
  const handleMoveToInProgress = async () => {
    if (!incident.assignedResponder) {
      // Auto-assign the selected responder if none assigned yet
      const responder = SAMPLE_RESPONDERS.find((r) => r.id === selectedResponderId) || SAMPLE_RESPONDERS[0];
      setIsUpdating(true);
      setErrorMsg('');
      try {
        await onUpdateIncident(incident.id, {
          assignedResponder: responder.name,
          assignedResponderRole: responder.role,
          status: 'In Progress',
          assignedAt: incident.assignedAt || new Date().toISOString(),
          actorName: currentActorName,
          note: `Unit arrived on scene. Incident operations underway.`,
        });
      } catch {
        setErrorMsg('Failed to update status to In Progress.');
      } finally {
        setIsUpdating(false);
      }
      return;
    }

    setIsUpdating(true);
    setErrorMsg('');
    try {
      await onUpdateIncident(incident.id, {
        status: 'In Progress',
        actorName: currentActorName,
        note: `Responder ${incident.assignedResponder} confirmed on-scene arrival. Operations in progress.`,
      });
    } catch {
      setErrorMsg('Failed to update status.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Finalize resolution
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

  // Reopen incident if needed
  const handleReopenIncident = async () => {
    setIsUpdating(true);
    setErrorMsg('');
    try {
      await onUpdateIncident(incident.id, {
        status: 'In Progress',
        actorName: currentActorName,
        note: 'Incident reopened for follow-up operations.',
      });
    } catch {
      setErrorMsg('Failed to reopen incident.');
    } finally {
      setIsUpdating(false);
    }
  };

  const formattedTime = new Date(incident.createdAt).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-4xl w-full my-8 overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
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
              <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                DEMO RECORD
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {errorMsg && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-200 text-xs rounded-lg">
              {errorMsg}
            </div>
          )}

          {/* Workflow Progress Tracker */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
              <span className="uppercase tracking-wider">Operational Lifecycle Progression</span>
              <span>Current Phase: {incident.status}</span>
            </div>

            {/* Stepper Bar */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'New', desc: 'Reported' },
                { label: 'Assigned', desc: 'Unit Alerted' },
                { label: 'In Progress', desc: 'On Scene' },
                { label: 'Resolved', desc: 'Secured' },
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

          {/* Grid: 2 Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Column 1: Incident & Citizen Details */}
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Citizen Incident Report
                </h3>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Emergency Type</span>
                    <span className="font-bold text-white text-sm flex items-center gap-1.5 mt-0.5">
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                      {incident.emergencyType}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block">Reported Severity</span>
                    <span className="font-bold text-rose-300 text-sm mt-0.5 block">
                      {incident.severity}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block">Time Reported</span>
                    <span className="font-medium text-slate-200 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {formattedTime}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block">People Affected</span>
                    <span className="font-medium text-slate-200 flex items-center gap-1 mt-0.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {incident.peopleAffected} Person(s)
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-xs text-slate-400 block mb-0.5">Incident Location</span>
                  <div className="flex items-start gap-1.5 text-xs text-slate-200 font-medium">
                    <MapPin className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                    <span>{incident.location}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-xs text-slate-400 block mb-1">Citizen Narrative</span>
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

              {/* Resolution Details if Resolved */}
              {incident.status === 'Resolved' && (
                <div className="bg-emerald-950/40 p-4 rounded-xl border border-emerald-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-emerald-300 uppercase flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Resolution Record
                    </span>
                    {incident.resolvedAt && (
                      <span className="text-[10px] text-emerald-400 font-mono">
                        {new Date(incident.resolvedAt).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-emerald-100 bg-emerald-950/60 p-3 rounded border border-emerald-900/60 leading-relaxed">
                    {incident.resolutionNotes || 'No notes specified.'}
                  </p>
                  <button
                    onClick={handleReopenIncident}
                    disabled={isUpdating}
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 pt-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reopen Incident for Follow-Up</span>
                  </button>
                </div>
              )}
            </div>

            {/* Column 2: AI Intelligence & Responder Controls */}
            <div className="space-y-4">
              {/* AI Incident Intelligence Card */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                      AI Incident Intelligence
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700">
                    {incident.aiSource === 'gemini' ? 'Gemini 3.8 Flash' : 'CivicSOS Neural Engine'}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">AI Classification</span>
                    <span className="font-semibold text-slate-100 block">
                      {incident.aiCategory}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Priority Level</span>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold border mt-0.5 ${getPriorityBadge(
                        incident.priority
                      )}`}
                    >
                      {incident.priority}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px] mb-0.5">Priority Justification</span>
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-900 p-2.5 rounded border border-slate-800 italic">
                      “{incident.priorityReason}”
                    </p>
                  </div>
                </div>
              </div>

              {/* Responder Assignment & Lifecycle Controls */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                  Dispatch & Response Controls
                </h3>

                {/* Assigned Responder Info */}
                <div className="text-xs bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block mb-1">Assigned Tactical Unit</span>
                  {incident.assignedResponder ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-sm text-emerald-400">
                        <UserCheck className="w-4 h-4" />
                        <span>{incident.assignedResponder}</span>
                      </div>
                      {incident.assignedResponderRole && (
                        <span className="text-[11px] text-slate-400">
                          {incident.assignedResponderRole}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-amber-400 font-semibold italic">
                      No Responder Assigned Yet
                    </span>
                  )}
                </div>

                {/* Assignment Dropdown & Button */}
                <div className="space-y-2">
                  <label className="text-[11px] text-slate-400 block">
                    {incident.assignedResponder ? 'Reassign Unit' : 'Select Responder to Deploy'}
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={selectedResponderId}
                      onChange={(e) => setSelectedResponderId(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                    >
                      {SAMPLE_RESPONDERS.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} · {r.role} ({r.badgeNumber})
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={handleAssignResponder}
                      disabled={isUpdating}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex-shrink-0"
                    >
                      {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Assign'}
                    </button>
                  </div>
                </div>

                {/* Status Transition Action Buttons */}
                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <span className="text-[11px] text-slate-400 block">Enforce Lifecycle State:</span>

                  {incident.status === 'New' && (
                    <button
                      onClick={handleAssignResponder}
                      disabled={isUpdating}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Assign Unit & Advance to "Assigned"</span>
                    </button>
                  )}

                  {(incident.status === 'New' || incident.status === 'Assigned') && (
                    <button
                      onClick={handleMoveToInProgress}
                      disabled={isUpdating}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors"
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span>Confirm On-Scene → Advance to "In Progress"</span>
                    </button>
                  )}

                  {incident.status === 'In Progress' && !showResolveForm && (
                    <button
                      onClick={() => setShowResolveForm(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Neutralize Hazard & Mark Resolved</span>
                    </button>
                  )}

                  {/* Resolution Form if opened */}
                  {showResolveForm && incident.status !== 'Resolved' && (
                    <form
                      onSubmit={handleResolveIncident}
                      className="bg-slate-900 p-3 rounded-lg border border-emerald-600/60 space-y-3"
                    >
                      <label className="text-xs font-bold text-white block">
                        Record Resolution Notes <span className="text-rose-400">*</span>
                      </label>
                      <textarea
                        rows={3}
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        placeholder="Detail the outcome: e.g. Patient stabilized and transferred to Mercy General; gas valve secured; traffic cleared."
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={isUpdating}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
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
                          className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs"
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

          {/* Audit Timeline */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                Chronological Audit Log ({incident.timeline.length} Entries)
              </h3>
            </div>

            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
              {incident.timeline.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 text-xs border-l-2 border-slate-700 pl-3 py-1"
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-[11px] mb-0.5">
                      <span className="font-bold text-slate-200">{entry.action}</span>
                      <span className="text-slate-500 font-mono">
                        {new Date(entry.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                    </div>
                    <span className="text-[10px] text-sky-400 block mb-0.5 font-medium">
                      By: {entry.actor}
                    </span>
                    {entry.details && (
                      <p className="text-slate-400 leading-snug">{entry.details}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 flex-shrink-0">
          <span>CivicSOS Secure Audit Trail Active</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
