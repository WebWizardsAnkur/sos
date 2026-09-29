import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ShieldAlert,
  ArrowUpDown,
  AlertTriangle,
  Clock,
  MapPin,
  UserCheck,
  CheckCircle2,
  ExternalLink,
  RotateCcw,
  Sparkles,
  HeartPulse,
  Flame,
  Car,
  Waves,
  Building2,
  HelpCircle,
  FilePlus2,
  Radio,
} from 'lucide-react';
import {
  Incident,
  EmergencyType,
  SeverityLevel,
  PriorityLevel,
  IncidentStatus,
} from '../types/incident.ts';

interface ResponderDashboardProps {
  incidents: Incident[];
  onSelectIncident: (incident: Incident) => void;
  onOpenReportForm: () => void;
  onResetDemo: () => void;
  initialFilterStatus?: IncidentStatus | 'ALL';
}

export const ResponderDashboard: React.FC<ResponderDashboardProps> = ({
  incidents,
  onSelectIncident,
  onOpenReportForm,
  onResetDemo,
  initialFilterStatus = 'ALL',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<EmergencyType | 'ALL'>('ALL');
  const [filterSeverity, setFilterSeverity] = useState<SeverityLevel | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<IncidentStatus | 'ALL' | 'CRITICAL'>(
    initialFilterStatus
  );
  const [filterSource, setFilterSource] = useState<'ALL' | 'REAL_ONLY' | 'DEMO_ONLY'>('ALL');
  const [sortBy, setSortBy] = useState<'priority' | 'newest' | 'severity'>('priority');

  // Counts for summary cards
  const totalCount = incidents.length;
  const newCount = incidents.filter((i) => i.status === 'New').length;
  const inProgressCount = incidents.filter((i) => i.status === 'In Progress').length;
  const criticalCount = incidents.filter((i) => i.priority === 'P1 - Critical').length;
  const resolvedCount = incidents.filter((i) => i.status === 'Resolved').length;

  // Filtered & Sorted Incidents
  const filteredIncidents = useMemo(() => {
    return incidents
      .filter((inc) => {
        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchId = inc.id.toLowerCase().includes(q);
          const matchLoc = inc.location.toLowerCase().includes(q);
          const matchDesc = inc.description.toLowerCase().includes(q);
          const matchType = inc.emergencyType.toLowerCase().includes(q);
          const matchCat = inc.aiCategory.toLowerCase().includes(q);
          const matchResp = inc.assignedResponder?.toLowerCase().includes(q);
          if (!matchId && !matchLoc && !matchDesc && !matchType && !matchCat && !matchResp) {
            return false;
          }
        }

        // Emergency Type
        if (filterType !== 'ALL' && inc.emergencyType !== filterType) {
          return false;
        }

        // Severity
        if (filterSeverity !== 'ALL' && inc.severity !== filterSeverity) {
          return false;
        }

        // Status or Critical filter
        if (filterStatus === 'CRITICAL') {
          if (inc.priority !== 'P1 - Critical') return false;
        } else if (filterStatus !== 'ALL') {
          if (inc.status !== filterStatus) return false;
        }

        // Source filter
        if (filterSource === 'REAL_ONLY' && inc.isSample) return false;
        if (filterSource === 'DEMO_ONLY' && !inc.isSample) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'priority') {
          const prioMap: { [key: string]: number } = {
            'P1 - Critical': 1,
            'P2 - High': 2,
            'P3 - Medium': 3,
            'P4 - Low': 4,
          };
          const diff = (prioMap[a.priority] || 5) - (prioMap[b.priority] || 5);
          if (diff !== 0) return diff;
          // Tie break with newest
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        } else if (sortBy === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        } else if (sortBy === 'severity') {
          const sevMap: { [key: string]: number } = {
            Critical: 1,
            High: 2,
            Medium: 3,
            Low: 4,
          };
          return (sevMap[a.severity] || 5) - (sevMap[b.severity] || 5);
        }
        return 0;
      });
  }, [
    incidents,
    searchQuery,
    filterType,
    filterSeverity,
    filterStatus,
    filterSource,
    sortBy,
  ]);

  const getEmergencyIcon = (type: EmergencyType) => {
    switch (type) {
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

  const getPriorityStyle = (priority: PriorityLevel) => {
    switch (priority) {
      case 'P1 - Critical':
        return 'bg-rose-950/80 text-rose-300 border-rose-800';
      case 'P2 - High':
        return 'bg-amber-950/80 text-amber-300 border-amber-800';
      case 'P3 - Medium':
        return 'bg-blue-950/80 text-blue-300 border-blue-800';
      case 'P4 - Low':
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getStatusStyle = (status: IncidentStatus) => {
    switch (status) {
      case 'New':
        return 'bg-sky-950 text-sky-300 border-sky-800 font-semibold';
      case 'Assigned':
        return 'bg-amber-950 text-amber-300 border-amber-800 font-semibold';
      case 'In Progress':
        return 'bg-blue-950 text-blue-300 border-blue-800 font-semibold';
      case 'Resolved':
        return 'bg-emerald-950 text-emerald-300 border-emerald-800 font-semibold';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Emergency Command Center
              </h1>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950 text-rose-400 border border-rose-800 uppercase animate-pulse">
                <Radio className="w-3 h-3" />
                Live Dispatch
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Real-time situational monitoring, AI triage categorization, and multi-unit deployment.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenReportForm}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-md transition-colors"
            >
              <FilePlus2 className="w-4 h-4" />
              <span>Simulate Citizen Report</span>
            </button>

            <button
              onClick={onResetDemo}
              title="Reset incident list to initial demo data"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs border border-slate-800 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Demo</span>
            </button>
          </div>
        </div>

        {/* TOP SUMMARY CARDS (Clickable for instant filtering) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Total Incidents */}
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`p-4 rounded-xl border text-left transition-all ${
              filterStatus === 'ALL'
                ? 'bg-slate-900 border-sky-500 ring-2 ring-sky-500/50'
                : 'bg-slate-900/60 border-slate-800 hover:bg-slate-900'
            }`}
          >
            <span className="text-[11px] font-mono text-slate-400 uppercase block mb-1">
              Total Incidents
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
                {totalCount}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">All Records</span>
            </div>
          </button>

          {/* New */}
          <button
            onClick={() => setFilterStatus('New')}
            className={`p-4 rounded-xl border text-left transition-all ${
              filterStatus === 'New'
                ? 'bg-sky-950/70 border-sky-400 ring-2 ring-sky-400/50'
                : 'bg-slate-900/60 border-slate-800 hover:bg-slate-900'
            }`}
          >
            <span className="text-[11px] font-mono text-sky-400 uppercase block mb-1">
              New / Unassigned
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-sky-300">
                {newCount}
              </span>
              {newCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping"></span>
              )}
            </div>
          </button>

          {/* In Progress */}
          <button
            onClick={() => setFilterStatus('In Progress')}
            className={`p-4 rounded-xl border text-left transition-all ${
              filterStatus === 'In Progress'
                ? 'bg-blue-950/70 border-blue-400 ring-2 ring-blue-400/50'
                : 'bg-slate-900/60 border-slate-800 hover:bg-slate-900'
            }`}
          >
            <span className="text-[11px] font-mono text-blue-400 uppercase block mb-1">
              In Progress
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-blue-300">
                {inProgressCount}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Units Deployed</span>
            </div>
          </button>

          {/* Critical P1 */}
          <button
            onClick={() => setFilterStatus('CRITICAL')}
            className={`p-4 rounded-xl border text-left transition-all ${
              filterStatus === 'CRITICAL'
                ? 'bg-rose-950/70 border-rose-500 ring-2 ring-rose-500/50'
                : 'bg-slate-900/60 border-slate-800 hover:bg-slate-900'
            }`}
          >
            <span className="text-[11px] font-mono text-rose-400 uppercase block mb-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              <span>Critical (P1)</span>
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-rose-400">
                {criticalCount}
              </span>
              {criticalCount > 0 && (
                <span className="text-[10px] text-rose-400 font-mono font-bold">URGENT</span>
              )}
            </div>
          </button>

          {/* Resolved */}
          <button
            onClick={() => setFilterStatus('Resolved')}
            className={`p-4 rounded-xl border text-left transition-all col-span-2 sm:col-span-1 ${
              filterStatus === 'Resolved'
                ? 'bg-emerald-950/70 border-emerald-400 ring-2 ring-emerald-400/50'
                : 'bg-slate-900/60 border-slate-800 hover:bg-slate-900'
            }`}
          >
            <span className="text-[11px] font-mono text-emerald-400 uppercase block mb-1">
              Resolved
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-300">
                {resolvedCount}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Completed</span>
            </div>
          </button>
        </div>

        {/* SEARCH & FILTERS TOOLBAR */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by ID, location, description, or assigned unit..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            {/* Quick Sort Control */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 flex items-center gap-1 flex-shrink-0">
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>Sort:</span>
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="priority">Priority (P1 Critical First)</option>
                <option value="newest">Newest Reported First</option>
                <option value="severity">Reported Severity</option>
              </select>
            </div>
          </div>

          {/* Filter Pills / Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80 text-xs">
            <span className="text-slate-400 flex items-center gap-1 font-mono text-[11px] uppercase mr-1">
              <Filter className="w-3 h-3" />
              <span>Filters:</span>
            </span>

            {/* Emergency Type filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="bg-slate-950 border border-slate-700 text-slate-200 rounded px-2 py-1 text-xs"
            >
              <option value="ALL">All Emergency Types</option>
              <option value="Medical">Medical</option>
              <option value="Fire">Fire</option>
              <option value="Accident">Accident</option>
              <option value="Flood">Flood</option>
              <option value="Infrastructure">Infrastructure</option>
              <option value="Other">Other</option>
            </select>

            {/* Severity filter */}
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value as any)}
              className="bg-slate-950 border border-slate-700 text-slate-200 rounded px-2 py-1 text-xs"
            >
              <option value="ALL">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            {/* Status filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="bg-slate-950 border border-slate-700 text-slate-200 rounded px-2 py-1 text-xs"
            >
              <option value="ALL">All Statuses</option>
              <option value="New">Status: New</option>
              <option value="Assigned">Status: Assigned</option>
              <option value="In Progress">Status: In Progress</option>
              <option value="Resolved">Status: Resolved</option>
              <option value="CRITICAL">Priority: P1 Critical Only</option>
            </select>

            {/* Source filter */}
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value as any)}
              className="bg-slate-950 border border-slate-700 text-slate-200 rounded px-2 py-1 text-xs"
            >
              <option value="ALL">All Sources</option>
              <option value="REAL_ONLY">Live Citizen Submissions Only</option>
              <option value="DEMO_ONLY">Demo Records Only</option>
            </select>

            {/* Clear Filters */}
            {(filterType !== 'ALL' ||
              filterSeverity !== 'ALL' ||
              filterStatus !== 'ALL' ||
              filterSource !== 'ALL' ||
              searchQuery) && (
              <button
                onClick={() => {
                  setFilterType('ALL');
                  setFilterSeverity('ALL');
                  setFilterStatus('ALL');
                  setFilterSource('ALL');
                  setSearchQuery('');
                }}
                className="text-[11px] text-sky-400 hover:text-sky-300 ml-auto underline"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* INCIDENT TABLE (Desktop / Tablet) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Incident ID</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-3">Severity</th>
                  <th className="py-3 px-4">AI Triage / Priority</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Reported</th>
                  <th className="py-3 px-4">Assigned Unit</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredIncidents.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-60" />
                      <p className="font-semibold text-slate-400">No matching incidents found</p>
                      <p className="text-xs text-slate-600 mt-1">
                        Try adjusting your search query or filters above.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredIncidents.map((incident) => {
                    const isCritical = incident.priority === 'P1 - Critical';
                    const timeAgo = formatTimeAgo(incident.createdAt);

                    return (
                      <tr
                        key={incident.id}
                        onClick={() => onSelectIncident(incident)}
                        className={`hover:bg-slate-800/60 cursor-pointer transition-colors ${
                          isCritical && incident.status !== 'Resolved'
                            ? 'bg-rose-950/20'
                            : ''
                        }`}
                      >
                        {/* ID */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 font-mono font-bold text-white">
                            <span>{incident.id}</span>
                            {!incident.isSample && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                                NEW
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Type */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                            {getEmergencyIcon(incident.emergencyType)}
                            <span>{incident.emergencyType}</span>
                          </div>
                        </td>

                        {/* Location */}
                        <td className="py-3 px-4 max-w-[200px]">
                          <div className="flex items-center gap-1 text-slate-300 truncate" title={incident.location}>
                            <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                            <span className="truncate">{incident.location}</span>
                          </div>
                        </td>

                        {/* Severity */}
                        <td className="py-3 px-3">
                          <span
                            className={`font-semibold ${
                              incident.severity === 'Critical'
                                ? 'text-rose-400'
                                : incident.severity === 'High'
                                ? 'text-amber-400'
                                : incident.severity === 'Medium'
                                ? 'text-blue-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {incident.severity}
                          </span>
                        </td>

                        {/* AI Priority & Category */}
                        <td className="py-3 px-4 max-w-[220px]">
                          <div className="space-y-0.5">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${getPriorityStyle(
                                incident.priority
                              )}`}
                            >
                              {incident.priority}
                            </span>
                            <span className="block text-[11px] text-slate-400 truncate" title={incident.aiCategory}>
                              {incident.aiCategory}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] border ${getStatusStyle(
                              incident.status
                            )}`}
                          >
                            {incident.status}
                          </span>
                        </td>

                        {/* Time */}
                        <td className="py-3 px-3 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                          {timeAgo}
                        </td>

                        {/* Assigned Unit */}
                        <td className="py-3 px-4">
                          {incident.assignedResponder ? (
                            <div className="flex items-center gap-1 text-slate-200 font-medium">
                              <UserCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                              <span className="truncate max-w-[130px]" title={incident.assignedResponder}>
                                {incident.assignedResponder}
                              </span>
                            </div>
                          ) : (
                            <span className="text-amber-400/80 italic text-[11px]">Unassigned</span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectIncident(incident);
                            }}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-white font-medium text-xs transition-colors border border-slate-700"
                          >
                            Dossier
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MOBILE CARD VIEW */}
        <div className="space-y-3 md:hidden">
          {filteredIncidents.length === 0 ? (
            <div className="py-12 bg-slate-900 border border-slate-800 rounded-xl text-center text-slate-500 p-6">
              <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-60" />
              <p className="font-semibold text-slate-400">No incidents match criteria</p>
            </div>
          ) : (
            filteredIncidents.map((incident) => {
              const isCritical = incident.priority === 'P1 - Critical';
              return (
                <div
                  key={incident.id}
                  onClick={() => onSelectIncident(incident)}
                  className={`bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 cursor-pointer ${
                    isCritical && incident.status !== 'Resolved'
                      ? 'border-rose-800/80 bg-rose-950/20'
                      : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-sm">
                        {incident.id}
                      </span>
                      {!incident.isSample && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                          CITIZEN
                        </span>
                      )}
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] border ${getStatusStyle(
                        incident.status
                      )}`}
                    >
                      {incident.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-slate-200">
                      {getEmergencyIcon(incident.emergencyType)}
                      <span>{incident.emergencyType}</span>
                      <span className="text-slate-500">·</span>
                      <span className="text-rose-400 font-semibold">{incident.severity}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getPriorityStyle(
                        incident.priority
                      )}`}
                    >
                      {incident.priority}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                    <span className="truncate">{incident.location}</span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2">{incident.description}</p>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimeAgo(incident.createdAt)}</span>
                    </span>

                    <span className="font-medium text-slate-300">
                      {incident.assignedResponder || 'Unassigned'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

function formatTimeAgo(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMin = Math.floor(diffMs / (1000 * 60));
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}
