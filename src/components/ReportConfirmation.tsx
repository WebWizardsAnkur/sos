import React from 'react';
import {
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  Clock,
  MapPin,
  Users,
  Sparkles,
  PhoneCall,
  Activity,
  AlertTriangle,
  Lightbulb,
  Radio,
  UserCheck,
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
        return 'bg-rose-950/90 text-rose-300 border-rose-800 ring-1 ring-rose-500/50';
      case 'P2 - High':
        return 'bg-amber-950/90 text-amber-300 border-amber-800 ring-1 ring-amber-500/50';
      case 'P3 - Medium':
        return 'bg-blue-950/90 text-blue-300 border-blue-800';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Success Banner */}
        <div className="bg-slate-900 border border-emerald-500/50 rounded-xl p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-44 h-44 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="w-16 h-16 bg-emerald-950/80 border border-emerald-500/80 rounded-full flex items-center justify-center text-emerald-400 mx-auto mb-4 shadow-lg shadow-emerald-950">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
            Emergency Transmitted & Triaged
          </h1>
          <p className="text-sm text-slate-300 max-w-lg mx-auto mb-6">
            Your emergency report has been logged to the CivicSOS operations network. AI neural triage
            has classified the threat and alerted local specialized response units.
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

        {/* AI Triage & Priority Analysis */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h2 className="font-bold text-base text-white">AI Neural Triage Assessment</h2>
            </div>
            <div className="flex items-center gap-2">
              {incident.aiSourceNote && (
                <span className="text-[10px] text-amber-400/90 font-mono bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/80">
                  {incident.aiSourceNote}
                </span>
              )}
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {incident.aiSource === 'gemini' ? 'Gemini 3.8 Flash' : 'Deterministic Emergency Engine'}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {/* Category & Priority Badge */}
            <div className="flex flex-wrap items-start justify-between gap-4 bg-slate-950 p-4 rounded-lg border border-slate-800">
              <div>
                <span className="text-[11px] font-mono uppercase text-slate-400 block mb-0.5">
                  AI Classified Category
                </span>
                <span className="text-base font-bold text-white">{incident.aiCategory}</span>
                <span className="text-xs text-slate-400 block mt-0.5">
                  Suggested Team:{' '}
                  <strong className="text-sky-300 font-semibold">
                    {incident.suggestedResponseTeam || incident.recommendedResponse?.suggestedTeam || 'General Operations'}
                  </strong>
                </span>
              </div>

              <div>
                <span className="text-[11px] font-mono uppercase text-slate-400 block mb-0.5">
                  Assigned Priority
                </span>
                <span
                  className={`inline-block px-3 py-1 rounded text-xs font-bold border uppercase tracking-wider ${getPriorityBadge(
                    incident.priority
                  )}`}
                >
                  {incident.priority}
                </span>
              </div>
            </div>

            {/* Why & Risk Factors */}
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
              <div>
                <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  Why:
                </span>
                <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-900/80 p-2.5 rounded border border-slate-800">
                  “{incident.priorityReason}”
                </p>
              </div>

              {incident.keyRiskFactors && incident.keyRiskFactors.length > 0 && (
                <div>
                  <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Identified Risk Factors:</span>
                  </span>
                  <ul className="space-y-1">
                    {incident.keyRiskFactors.map((risk, idx) => (
                      <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                        <span className="text-rose-400 font-bold">•</span>
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* AI Response Recommendation */}
            {incident.recommendedResponse && (
              <div className="bg-gradient-to-r from-sky-950/60 to-slate-950 border border-sky-800/80 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-sky-200">
                      AI Response Recommendation
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 italic">
                    AI-Assisted Operational Guidance
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div>
                    <span className="text-slate-400 block font-semibold text-[11px]">Immediate Action:</span>
                    <p className="text-slate-100 font-medium leading-relaxed">
                      {incident.recommendedResponse.immediateAction}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-sky-900/40 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">Suggested Unit:</span>
                      <span className="text-emerald-300 font-semibold">
                        {incident.recommendedResponse.suggestedTeam}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Risk Consideration:</span>
                      <span className="text-amber-200 font-medium">
                        {incident.recommendedResponse.riskConsideration}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Submitted Incident Summary */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
          <h2 className="font-bold text-xs text-slate-400 uppercase tracking-wider font-mono mb-4">
            Citizen Dossier Summary
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
            <span className="text-slate-400 block mb-1">Reported Description</span>
            <p className="text-slate-200 leading-relaxed">{incident.description}</p>
          </div>
        </div>

        {/* Safety Callout */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 flex items-start gap-3">
          <PhoneCall className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-white mb-0.5">Operational Protocol</p>
            <p className="text-slate-400">
              Emergency responders may call you for building access or patient verification. Keep this
              tab open to monitor real-time response unit status.
            </p>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            onClick={() => onGoToDashboard(incident.id)}
            className="w-full sm:flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm shadow-md transition-colors cursor-pointer"
          >
            <Activity className="w-4 h-4" />
            <span>Open in Responder Command Center</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onReportAnother}
            className="w-full sm:w-auto px-4 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition-colors cursor-pointer"
          >
            Submit Another Report
          </button>

          <button
            onClick={onGoHome}
            className="w-full sm:w-auto px-4 py-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium text-xs border border-slate-800 transition-colors cursor-pointer"
          >
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
};
