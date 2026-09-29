import React from 'react';
import {
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  Clock,
  MapPin,
  Users,
  Sparkles,
  Home,
  ExternalLink,
  PhoneCall,
  Activity,
} from 'lucide-react';
import { Incident } from '../types/incident.ts';

interface ReportConfirmationProps {
  incident: Incident;
  onGoHome: () => void;
  onGoToDashboard: (incidentId?: string) => void;
  onReportAnother: () => void;
}

export const ReportConfirmation: React.FC<ReportConfirmationProps> = ({
  incident,
  onGoHome,
  onGoToDashboard,
  onReportAnother,
}) => {
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'P1 - Critical':
        return 'bg-rose-950/80 text-rose-300 border-rose-800';
      case 'P2 - High':
        return 'bg-amber-950/80 text-amber-300 border-amber-800';
      case 'P3 - Medium':
        return 'bg-blue-950/80 text-blue-300 border-blue-800';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Success Banner */}
        <div className="bg-slate-900 border border-emerald-500/50 rounded-xl p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="w-16 h-16 bg-emerald-950/80 border border-emerald-500/80 rounded-full flex items-center justify-center text-emerald-400 mx-auto mb-4">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
            Emergency Transmitted Successfully
          </h1>
          <p className="text-sm text-slate-300 max-w-lg mx-auto mb-6">
            Your emergency report has been saved to the municipal dispatch network. Response units
            and triage personnel have been alerted.
          </p>

          {/* Incident ID Spotlight */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 inline-block mx-auto min-w-[280px]">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
              Official Incident Tracking ID
            </span>
            <span className="font-mono text-2xl font-black text-white tracking-wider selection:bg-rose-500 selection:text-white">
              {incident.id}
            </span>
            <div className="mt-2 flex items-center justify-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold bg-sky-950 text-sky-300 border border-sky-800">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping"></span>
                Status: {incident.status}
              </span>
            </div>
          </div>
        </div>

        {/* AI Triage Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h2 className="font-bold text-base text-white">AI Incident Triage Analysis</h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {incident.aiSource === 'gemini' ? 'Gemini 3.8 Flash' : 'CivicSOS Neural Engine'}
            </span>
          </div>

          <div className="space-y-3 bg-slate-950/60 p-4 rounded-lg border border-slate-800/80">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs text-slate-400 block">AI Classified Category</span>
                <span className="text-sm font-semibold text-slate-100">{incident.aiCategory}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Priority Level</span>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold border ${getPriorityBadge(
                    incident.priority
                  )}`}
                >
                  {incident.priority}
                </span>
              </div>
            </div>

            <div>
              <span className="text-xs text-slate-400 block mb-0.5">Triage Assessment Rationale</span>
              <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-900/60 p-2.5 rounded border border-slate-800">
                “{incident.priorityReason}”
              </p>
            </div>
          </div>
        </div>

        {/* Submitted Incident Details Summary */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
          <h2 className="font-bold text-sm text-slate-300 uppercase tracking-wider font-mono mb-4">
            Incident Dossier Summary
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block mb-1">Emergency Type</span>
              <span className="font-semibold text-sm text-white flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                {incident.emergencyType}
              </span>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block mb-1">Reported Severity</span>
              <span className="font-semibold text-sm text-rose-300">{incident.severity}</span>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block mb-1">Location</span>
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400" />
                {incident.location}
              </span>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block mb-1">People Affected</span>
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-400" />
                {incident.peopleAffected} Individual(s)
              </span>
            </div>
          </div>

          <div className="mt-4 bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-400 block mb-1">Reported Narrative</span>
            <p className="text-slate-200">{incident.description}</p>
          </div>
        </div>

        {/* Next Steps / Citizen Safety */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 flex items-start gap-3">
          <PhoneCall className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-white mb-0.5">Keep Phone Line Open</p>
            <p className="text-slate-400">
              Emergency responders may call you for gate codes, specific floor entry, or victim status
              while en route. Please remain in a safe location.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            onClick={() => onGoToDashboard(incident.id)}
            className="w-full sm:flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm shadow-md transition-colors"
          >
            <Activity className="w-4 h-4" />
            <span>Open in Responder Command Center</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onReportAnother}
            className="w-full sm:w-auto px-4 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition-colors"
          >
            Submit Another Report
          </button>

          <button
            onClick={onGoHome}
            className="w-full sm:w-auto px-4 py-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium text-xs border border-slate-800 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
};
