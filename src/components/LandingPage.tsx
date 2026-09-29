import React from 'react';
import {
  ShieldAlert,
  ArrowRight,
  Activity,
  Zap,
  Users,
  CheckCircle,
  Clock,
  Radio,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { Incident } from '../types/incident.ts';

interface LandingPageProps {
  onReportClick: () => void;
  onDashboardClick: () => void;
  incidents: Incident[];
  onDemoPrefillAndGo: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onReportClick,
  onDashboardClick,
  incidents,
  onDemoPrefillAndGo,
}) => {
  const total = incidents.length;
  const critical = incidents.filter(
    (i) => i.priority === 'P1 - Critical' && i.status !== 'Resolved'
  ).length;
  const inProgress = incidents.filter((i) => i.status === 'In Progress').length;
  const resolved = incidents.filter((i) => i.status === 'Resolved').length;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Emergency Status Banner */}
      <div className="bg-slate-900/90 border-b border-slate-800 py-2.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-slate-200">
              Civic Emergency Dispatch Grid Active
            </span>
            <span className="text-slate-500 hidden sm:inline">|</span>
            <span className="text-slate-400 hidden sm:inline">
              Automated AI Neural Triage Enabled
            </span>
          </div>

          <div className="flex items-center gap-4 font-mono">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Active Incidents:</span>
              <span className="text-sky-400 font-bold">{total - resolved}</span>
            </div>
            {critical > 0 && (
              <div className="flex items-center gap-1.5 text-rose-400 font-bold bg-rose-950/60 px-2 py-0.5 rounded border border-rose-900/50">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{critical} Critical (P1)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 flex-1 flex flex-col justify-center">
        <div className="max-w-3xl">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-rose-950/80 border border-rose-800/80 text-rose-300 text-xs font-semibold mb-6">
            <Radio className="w-3.5 h-3.5 animate-pulse text-rose-400" />
            <span>Next-Generation Municipal Incident Response</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-4 leading-tight">
            Report. Prioritize.{' '}
            <span className="text-rose-500 underline decoration-rose-500/40 decoration-4">
              Respond. Resolve.
            </span>
          </h1>

          {/* Description */}
          <p className="text-lg sm:text-xl text-slate-300 mb-8 leading-relaxed">
            CivicSOS is an AI-powered emergency incident reporting and response coordination platform.
            Citizens report critical emergencies in seconds, while responders and dispatchers analyze,
            prioritize with neural triage, assign units, and resolve incidents in real time.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-10">
            <button
              onClick={onReportClick}
              className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-base shadow-lg shadow-rose-950/50 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <ShieldAlert className="w-5 h-5" />
              <span>Report Emergency</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <button
              onClick={onDashboardClick}
              className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-base border border-slate-700 transition-colors"
            >
              <Activity className="w-5 h-5 text-sky-400" />
              <span>Responder Dashboard</span>
            </button>

            <button
              onClick={onDemoPrefillAndGo}
              title="One-click demo for hackathon reviewers: autofills a Critical Medical emergency"
              className="flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium border border-slate-800 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Quick Demo: Critical Medical</span>
            </button>
          </div>
        </div>

        {/* 4-Step Operational Workflow */}
        <div className="mt-6 pt-8 border-t border-slate-800">
          <div className="mb-4">
            <h2 className="text-xs font-mono font-bold tracking-wider uppercase text-slate-400">
              The 4-Step Incident Lifecycle
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Step 1 */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-5 relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-2xl font-black text-rose-500/80">01</span>
                <span className="p-2 rounded bg-rose-950/60 text-rose-400 border border-rose-900/60">
                  <ShieldAlert className="w-4 h-4" />
                </span>
              </div>
              <h3 className="font-bold text-base text-white mb-1">Report</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Citizens submit urgent incidents with emergency type, severity, location, and people affected via a frictionless interface.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-5 relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-2xl font-black text-amber-500/80">02</span>
                <span className="p-2 rounded bg-amber-950/60 text-amber-400 border border-amber-900/60">
                  <Zap className="w-4 h-4" />
                </span>
              </div>
              <h3 className="font-bold text-base text-white mb-1">Prioritize</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                AI neural triage assesses operational threat, categorizes severity, and assigns P1–P4 priorities with human-readable rationale.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-5 relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-2xl font-black text-sky-500/80">03</span>
                <span className="p-2 rounded bg-sky-950/60 text-sky-400 border border-sky-900/60">
                  <Users className="w-4 h-4" />
                </span>
              </div>
              <h3 className="font-bold text-base text-white mb-1">Respond</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Dispatchers deploy specialized units (EMS, Fire, Traffic, Hazmat, Utilities) and advance state to In Progress on scene.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-5 relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-2xl font-black text-emerald-500/80">04</span>
                <span className="p-2 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-900/60">
                  <CheckCircle className="w-4 h-4" />
                </span>
              </div>
              <h3 className="font-bold text-base text-white mb-1">Resolve</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Responders document scene resolution notes, confirm hazard neutralization, and maintain immutable audit timestamps.
              </p>
            </div>
          </div>
        </div>

        {/* Live System Metrics Quick Strip */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-900/50 border border-slate-800/80 rounded p-3">
            <span className="text-[11px] text-slate-400 uppercase font-mono block">Total Registered</span>
            <span className="text-xl font-bold font-mono text-slate-100">{total}</span>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/80 rounded p-3">
            <span className="text-[11px] text-slate-400 uppercase font-mono block">In Progress</span>
            <span className="text-xl font-bold font-mono text-sky-400">{inProgress}</span>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/80 rounded p-3">
            <span className="text-[11px] text-slate-400 uppercase font-mono block">P1 Critical</span>
            <span className="text-xl font-bold font-mono text-rose-400">{critical}</span>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/80 rounded p-3">
            <span className="text-[11px] text-slate-400 uppercase font-mono block">Resolved</span>
            <span className="text-xl font-bold font-mono text-emerald-400">{resolved}</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800/80 py-4 px-4 text-center text-xs text-slate-500">
        CivicSOS Incident Command & Response System · Designed for Mission-Critical Emergency Dispatch
      </footer>
    </div>
  );
};
