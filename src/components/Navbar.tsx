import React from 'react';
import {
  ShieldAlert,
  Radio,
  FilePlus2,
  LayoutDashboard,
  BarChart3,
  RotateCcw,
  CheckCircle2,
  UserCheck,
} from 'lucide-react';
import { Incident } from '../types/incident.ts';
import { SAMPLE_RESPONDERS } from '../data/responders.ts';

interface NavbarProps {
  currentView: 'landing' | 'report' | 'confirmation' | 'dashboard' | 'analytics';
  setCurrentView: (view: 'landing' | 'report' | 'confirmation' | 'dashboard' | 'analytics') => void;
  incidents: Incident[];
  activeResponderId: string;
  setActiveResponderId: (id: string) => void;
  onResetDemo: () => void;
  onQuickDemoPrefill?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  incidents,
  activeResponderId,
  setActiveResponderId,
  onResetDemo,
}) => {
  const activeCount = incidents.filter((i) => i.status !== 'Resolved').length;
  const criticalCount = incidents.filter(
    (i) => i.priority === 'P1 - Critical' && i.status !== 'Resolved'
  ).length;

  const currentResponder =
    SAMPLE_RESPONDERS.find((r) => r.id === activeResponderId) || SAMPLE_RESPONDERS[0];

  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-slate-100 border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Logo & Brand */}
          <div
            onClick={() => setCurrentView('landing')}
            className="flex items-center gap-3 cursor-pointer group select-none flex-shrink-0"
          >
            <div className="w-10 h-10 rounded-lg bg-rose-600 flex items-center justify-center text-white shadow-inner group-hover:bg-rose-500 transition-colors">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xl tracking-tight text-white">CivicSOS</span>
                <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded bg-rose-950/80 text-rose-300 border border-rose-800">
                  LIVE DISPATCH
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Report · Prioritize · Respond · Resolve
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setCurrentView('landing')}
              className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                currentView === 'landing'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Home
            </button>

            <button
              onClick={() => setCurrentView('report')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-all ${
                currentView === 'report' || currentView === 'confirmation'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-rose-600/90 text-white hover:bg-rose-600 shadow-sm'
              }`}
            >
              <FilePlus2 className="w-4 h-4" />
              <span>Report Emergency</span>
            </button>

            <button
              onClick={() => setCurrentView('dashboard')}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                currentView === 'dashboard'
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-sky-400" />
              <span>Dashboard</span>
              {criticalCount > 0 && (
                <span className="flex items-center justify-center min-w-5 h-5 px-1 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                  {criticalCount}
                </span>
              )}
              {criticalCount === 0 && activeCount > 0 && (
                <span className="flex items-center justify-center min-w-5 h-5 px-1 rounded-full text-[10px] font-bold bg-sky-600 text-white">
                  {activeCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setCurrentView('analytics')}
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                currentView === 'analytics'
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span>Analytics</span>
            </button>
          </nav>

          {/* Right Actions: Responder Profile & Reset */}
          <div className="flex items-center gap-2">
            {/* Active Responder Picker */}
            <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-slate-800 text-xs">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <div className="text-left">
                <span className="text-[10px] text-slate-400 block leading-tight">Current Unit</span>
                <select
                  value={activeResponderId}
                  onChange={(e) => setActiveResponderId(e.target.value)}
                  className="bg-slate-800 text-slate-200 text-xs rounded border border-slate-700 py-0.5 px-1.5 focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium"
                >
                  {SAMPLE_RESPONDERS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.badgeNumber})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Reset Demo Data button */}
            <button
              onClick={onResetDemo}
              title="Reset incidents to default demo dataset"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors border border-slate-800"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Reset Demo</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
