import React, { useState, useEffect } from 'react';
import { Incident, EmergencyType, SeverityLevel, IncidentSubmissionData } from './types/incident.ts';
import { incidentStorage } from './services/incidentStorage.ts';
import { SAMPLE_RESPONDERS } from './data/responders.ts';
import { Navbar } from './components/Navbar.tsx';
import { LandingPage } from './components/LandingPage.tsx';
import { CitizenReportForm } from './components/CitizenReportForm.tsx';
import { ReportConfirmation } from './components/ReportConfirmation.tsx';
import { ResponderDashboard } from './components/ResponderDashboard.tsx';
import { IncidentDetailsModal } from './components/IncidentDetailsModal.tsx';
import { AnalyticsSection } from './components/AnalyticsSection.tsx';
import { Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

export default function App() {
  const [incidents, setIncidents] = useState<Incident[]>(() =>
    incidentStorage.getIncidentsSync()
  );
  const [currentView, setCurrentView] = useState<
    'landing' | 'report' | 'confirmation' | 'dashboard' | 'analytics'
  >('landing');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [submittedIncident, setSubmittedIncident] = useState<Incident | null>(null);
  const [activeResponderId, setActiveResponderId] = useState<string>(SAMPLE_RESPONDERS[0].id);

  // Form prefill state for demo scenarios
  const [formPrefill, setFormPrefill] = useState<{
    emergencyType?: EmergencyType;
    severity?: SeverityLevel;
    location?: string;
    peopleAffected?: number;
    description?: string;
    contactName?: string;
    contactNumber?: string;
  } | undefined>(undefined);

  // Initial load & real-time synchronization
  useEffect(() => {
    // Fetch latest incidents from storage/server
    incidentStorage.getAllIncidents().then((data) => {
      if (data && data.length > 0) {
        setIncidents(data);
      }
    });

    // Subscribe to cross-tab / storage updates
    const unsubscribe = incidentStorage.subscribe((updated) => {
      setIncidents(updated);
      // Keep selected incident up to date if open
      if (selectedIncident) {
        const refreshed = updated.find((i) => i.id === selectedIncident.id);
        if (refreshed) {
          setSelectedIncident(refreshed);
        }
      }
    });

    return () => unsubscribe();
  }, [selectedIncident]);

  // Handle citizen emergency report submission
  const handleSubmitIncident = async (data: IncidentSubmissionData): Promise<Incident> => {
    const saved = await incidentStorage.createIncident(data);
    setIncidents((prev) => [saved, ...prev.filter((i) => i.id !== saved.id)]);
    setSubmittedIncident(saved);
    setCurrentView('confirmation');
    return saved;
  };

  // Handle incident updates (responder assignment, status changes, resolution notes)
  const handleUpdateIncident = async (
    id: string,
    updates: Partial<Incident> & { actorName?: string; note?: string }
  ) => {
    const updated = await incidentStorage.updateIncident(id, updates);
    if (updated) {
      setIncidents((prev) =>
        prev.map((item) => (item.id === id ? updated : item))
      );
      if (selectedIncident?.id === id) {
        setSelectedIncident(updated);
      }
    }
  };

  // Reset to default demo data
  const handleResetDemo = async () => {
    const fresh = await incidentStorage.resetToDemoData();
    setIncidents(fresh);
    if (selectedIncident) {
      setSelectedIncident(null);
    }
  };

  // One-click demo prefill for quick acceptance testing
  const handleDemoPrefillAndGo = () => {
    setFormPrefill({
      emergencyType: 'Medical',
      severity: 'Critical',
      location: 'Central Metro Station, Platform 3',
      peopleAffected: 2,
      description:
        'Commuter collapsed on platform with severe cardiac symptoms, unresponsive; bystander starting CPR.',
      contactName: 'James Rodriguez (Station Officer)',
      contactNumber: '+1 (555) 019-2831',
    });
    setCurrentView('report');
  };

  const currentResponder =
    SAMPLE_RESPONDERS.find((r) => r.id === activeResponderId) || SAMPLE_RESPONDERS[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-600 selection:text-white">
      {/* Universal Navigation */}
      <Navbar
        currentView={currentView}
        setCurrentView={(view) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        incidents={incidents}
        activeResponderId={activeResponderId}
        setActiveResponderId={setActiveResponderId}
        onResetDemo={handleResetDemo}
      />

      {/* Main View Switcher */}
      <div className="flex-1">
        {currentView === 'landing' && (
          <LandingPage
            onReportClick={() => {
              setFormPrefill(undefined);
              setCurrentView('report');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onDashboardClick={() => {
              setCurrentView('dashboard');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            incidents={incidents}
            onDemoPrefillAndGo={handleDemoPrefillAndGo}
          />
        )}

        {currentView === 'report' && (
          <CitizenReportForm
            submitIncidentHandler={handleSubmitIncident}
            onSubmitSuccess={(incident) => {
              setSubmittedIncident(incident);
              setCurrentView('confirmation');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onCancel={() => {
              setCurrentView('landing');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            initialPrefill={formPrefill}
          />
        )}

        {currentView === 'confirmation' && submittedIncident && (
          <ReportConfirmation
            incident={submittedIncident}
            onGoHome={() => {
              setCurrentView('landing');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onGoToDashboard={(targetId) => {
              setCurrentView('dashboard');
              if (targetId) {
                const target = incidents.find((i) => i.id === targetId) || submittedIncident;
                setSelectedIncident(target);
              }
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onReportAnother={() => {
              setFormPrefill(undefined);
              setCurrentView('report');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentView === 'dashboard' && (
          <ResponderDashboard
            incidents={incidents}
            onSelectIncident={(incident) => setSelectedIncident(incident)}
            onOpenReportForm={() => {
              setFormPrefill(undefined);
              setCurrentView('report');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onResetDemo={handleResetDemo}
          />
        )}

        {currentView === 'analytics' && (
          <AnalyticsSection
            incidents={incidents}
            onBackToDashboard={() => {
              setCurrentView('dashboard');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
      </div>

      {/* Incident Details Modal Dossier */}
      {selectedIncident && (
        <IncidentDetailsModal
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          onUpdateIncident={handleUpdateIncident}
          currentActorName={`${currentResponder.name} (${currentResponder.badgeNumber})`}
        />
      )}
    </div>
  );
}
