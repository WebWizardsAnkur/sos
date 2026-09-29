import React from 'react';
import {
  BarChart3,
  PieChart,
  Users,
  Clock,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  HeartPulse,
  Flame,
  Car,
  Waves,
  Building2,
  HelpCircle,
} from 'lucide-react';
import { Incident, EmergencyType } from '../types/incident.ts';

interface AnalyticsSectionProps {
  incidents: Incident[];
  onBackToDashboard: () => void;
}

export const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({
  incidents,
  onBackToDashboard,
}) => {
  const total = incidents.length;
  const resolved = incidents.filter((i) => i.status === 'Resolved').length;
  const inProgress = incidents.filter((i) => i.status === 'In Progress').length;
  const newCount = incidents.filter((i) => i.status === 'New').length;
  const assigned = incidents.filter((i) => i.status === 'Assigned').length;

  const totalPeopleAffected = incidents.reduce((acc, i) => acc + (i.peopleAffected || 1), 0);
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  // Breakdown by Type
  const types: EmergencyType[] = ['Medical', 'Fire', 'Accident', 'Flood', 'Infrastructure', 'Other'];
  const typeCounts = types.map((t) => ({
    type: t,
    count: incidents.filter((i) => i.emergencyType === t).length,
  }));

  // Breakdown by Priority
  const p1 = incidents.filter((i) => i.priority === 'P1 - Critical').length;
  const p2 = incidents.filter((i) => i.priority === 'P2 - High').length;
  const p3 = incidents.filter((i) => i.priority === 'P3 - Medium').length;
  const p4 = incidents.filter((i) => i.priority === 'P4 - Low').length;

  const getTypeIcon = (t: EmergencyType) => {
    switch (t) {
      case 'Medical':
        return <HeartPulse className="w-4 h-4 text-rose-400" />;
      case 'Fire':
        return <Flame className="w-4 h-4 text-amber-500" />;
      case 'Accident':
        return <Car className="w-4 h-4 text-amber-400" />;
      case 'Flood':
        return <Waves className="w-4 h-4 text-blue-400" />;
      case 'Infrastructure':
        return <Building2 className="w-4 h-4 text-emerald-400" />;
      case 'Other':
      default:
        return <HelpCircle className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-sky-400" />
              <h1 className="text-2xl font-bold text-white">Emergency Response Operations Analytics</h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Aggregated incident distribution, priority allocation, and mitigation throughput.
            </p>
          </div>

          <button
            onClick={onBackToDashboard}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors self-start sm:self-auto"
          >
            ← Return to Dashboard
          </button>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <span className="text-[11px] font-mono text-slate-400 uppercase block mb-1">
              Total Incidents
            </span>
            <span className="text-3xl font-extrabold font-mono text-white">{total}</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <span className="text-[11px] font-mono text-slate-400 uppercase block mb-1">
              People Affected
            </span>
            <span className="text-3xl font-extrabold font-mono text-sky-400">
              {totalPeopleAffected}
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <span className="text-[11px] font-mono text-slate-400 uppercase block mb-1">
              Resolution Rate
            </span>
            <span className="text-3xl font-extrabold font-mono text-emerald-400">
              {resolutionRate}%
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <span className="text-[11px] font-mono text-slate-400 uppercase block mb-1">
              Critical (P1) Load
            </span>
            <span className="text-3xl font-extrabold font-mono text-rose-400">{p1}</span>
          </div>
        </div>

        {/* Visual Analytics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Emergency Types Breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-300">
              Distribution by Emergency Type
            </h2>

            <div className="space-y-3">
              {typeCounts.map((item) => {
                const percent = total > 0 ? Math.round((item.count / total) * 100) : 0;
                return (
                  <div key={item.type} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(item.type)}
                        <span className="font-semibold text-slate-200">{item.type}</span>
                      </div>
                      <span className="font-mono text-slate-400">
                        {item.count} ({percent}%)
                      </span>
                    </div>

                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                      <div
                        className="bg-sky-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Priority Triage Distribution */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-300">
              AI Triage Priority Levels
            </h2>

            <div className="space-y-3">
              {/* P1 */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-rose-400">P1 - Critical</span>
                  <span className="font-mono text-slate-400">
                    {p1} ({total > 0 ? Math.round((p1 / total) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className="bg-rose-500 h-full rounded-full transition-all"
                    style={{ width: `${total > 0 ? (p1 / total) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* P2 */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-amber-400">P2 - High</span>
                  <span className="font-mono text-slate-400">
                    {p2} ({total > 0 ? Math.round((p2 / total) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all"
                    style={{ width: `${total > 0 ? (p2 / total) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* P3 */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-blue-400">P3 - Medium</span>
                  <span className="font-mono text-slate-400">
                    {p3} ({total > 0 ? Math.round((p3 / total) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all"
                    style={{ width: `${total > 0 ? (p3 / total) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* P4 */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-400">P4 - Low</span>
                  <span className="font-mono text-slate-400">
                    {p4} ({total > 0 ? Math.round((p4 / total) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className="bg-slate-600 h-full rounded-full transition-all"
                    style={{ width: `${total > 0 ? (p4 / total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Lifecycle Pipeline Status */}
            <div className="pt-4 border-t border-slate-800">
              <span className="text-xs font-mono text-slate-400 uppercase block mb-2">
                Operational Pipeline Status
              </span>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                  <span className="text-sky-400 font-bold block">{newCount}</span>
                  <span className="text-[10px] text-slate-500">New</span>
                </div>
                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                  <span className="text-amber-400 font-bold block">{assigned}</span>
                  <span className="text-[10px] text-slate-500">Assigned</span>
                </div>
                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                  <span className="text-blue-400 font-bold block">{inProgress}</span>
                  <span className="text-[10px] text-slate-500">In Progress</span>
                </div>
                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                  <span className="text-emerald-400 font-bold block">{resolved}</span>
                  <span className="text-[10px] text-slate-500">Resolved</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
