import React, { useState } from 'react';
import {
  HeartPulse,
  Flame,
  Car,
  Waves,
  Building2,
  HelpCircle,
  MapPin,
  Users,
  AlertOctagon,
  Phone,
  User,
  Send,
  Loader2,
  Sparkles,
  ArrowLeft,
  Navigation,
} from 'lucide-react';
import { EmergencyType, SeverityLevel, Incident, IncidentSubmissionData } from '../types/incident.ts';

interface CitizenReportFormProps {
  onSubmitSuccess: (incident: Incident) => void;
  onCancel: () => void;
  submitIncidentHandler: (data: IncidentSubmissionData) => Promise<Incident>;
  initialPrefill?: Partial<{
    emergencyType: EmergencyType;
    severity: SeverityLevel;
    location: string;
    peopleAffected: number;
    description: string;
    contactName: string;
    contactNumber: string;
  }>;
}

const EMERGENCY_TYPES: Array<{
  type: EmergencyType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}> = [
  {
    type: 'Medical',
    label: 'Medical',
    icon: HeartPulse,
    description: 'Cardiac arrest, trauma, unconsciousness, severe illness',
  },
  {
    type: 'Fire',
    label: 'Fire',
    icon: Flame,
    description: 'Structure fire, wildfire, smoke, chemical hazard',
  },
  {
    type: 'Accident',
    label: 'Accident',
    icon: Car,
    description: 'Vehicle collision, rollover, entrapment, pedestrian',
  },
  {
    type: 'Flood',
    label: 'Flood',
    icon: Waves,
    description: 'Flash flooding, water rescue, submerged vehicle',
  },
  {
    type: 'Infrastructure',
    label: 'Infrastructure',
    icon: Building2,
    description: 'Gas leak, downed power lines, structural collapse',
  },
  {
    type: 'Other',
    label: 'Other',
    icon: HelpCircle,
    description: 'Public hazard, environmental threat, other emergency',
  },
];

const SEVERITY_LEVELS: Array<{
  level: SeverityLevel;
  label: string;
  sub: string;
  colorClass: string;
  selectedClass: string;
}> = [
  {
    level: 'Critical',
    label: 'Critical',
    sub: 'Immediate danger to life',
    colorClass: 'border-rose-400/40 text-rose-300',
    selectedClass: 'bg-rose-950/80 border-rose-500 text-rose-200 ring-2 ring-rose-500',
  },
  {
    level: 'High',
    label: 'High',
    sub: 'Severe injuries or threat',
    colorClass: 'border-amber-400/40 text-amber-300',
    selectedClass: 'bg-amber-950/80 border-amber-500 text-amber-200 ring-2 ring-amber-500',
  },
  {
    level: 'Medium',
    label: 'Medium',
    sub: 'Urgent, non-life-threatening',
    colorClass: 'border-blue-400/40 text-blue-300',
    selectedClass: 'bg-blue-950/80 border-blue-500 text-blue-200 ring-2 ring-blue-500',
  },
  {
    level: 'Low',
    label: 'Low',
    sub: 'Minor hazard or property issue',
    colorClass: 'border-slate-500 text-slate-300',
    selectedClass: 'bg-slate-800 border-slate-400 text-white ring-2 ring-slate-400',
  },
];

export const CitizenReportForm: React.FC<CitizenReportFormProps> = ({
  onSubmitSuccess,
  onCancel,
  submitIncidentHandler,
  initialPrefill,
}) => {
  const [emergencyType, setEmergencyType] = useState<EmergencyType>(
    initialPrefill?.emergencyType || 'Medical'
  );
  const [severity, setSeverity] = useState<SeverityLevel>(
    initialPrefill?.severity || 'Critical'
  );
  const [location, setLocation] = useState(
    initialPrefill?.location || 'Central Metro Station, Platform 3'
  );
  const [peopleAffected, setPeopleAffected] = useState<number>(
    initialPrefill?.peopleAffected || 1
  );
  const [description, setDescription] = useState(
    initialPrefill?.description ||
      'Person collapsed on the train platform, appears unconscious and unresponsive. Immediate medical assistance needed.'
  );
  const [contactName, setContactName] = useState(initialPrefill?.contactName || 'Alex Mercer');
  const [contactNumber, setContactNumber] = useState(initialPrefill?.contactNumber || '555-0199');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!emergencyType) newErrors.emergencyType = 'Please select an emergency type.';
    if (!severity) newErrors.severity = 'Please select an estimated severity level.';
    if (!location.trim()) newErrors.location = 'Incident location is required for responder dispatch.';
    if (!description.trim()) newErrors.description = 'Please describe the emergency situation.';
    if (peopleAffected < 1) newErrors.peopleAffected = 'At least 1 person affected must be indicated.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      // Scroll to top of form
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    try {
      const savedIncident = await submitIncidentHandler({
        emergencyType,
        severity,
        location: location.trim(),
        peopleAffected: Number(peopleAffected),
        description: description.trim(),
        contactName: contactName.trim() || undefined,
        contactNumber: contactNumber.trim() || undefined,
      });

      onSubmitSuccess(savedIncident);
    } catch (err) {
      console.error('Submission failed:', err);
      setErrors({ form: 'An error occurred while submitting your emergency. Please retry.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation(
            `GPS Coordinates: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(
              4
            )} (Civic Sector 9)`
          );
        },
        () => {
          setLocation('Near 500 Civic Center Blvd & 8th Avenue');
        }
      );
    } else {
      setLocation('Near 500 Civic Center Blvd & 8th Avenue');
    }
  };

  const applyDemoScenario = (scenario: 'criticalMedical' | 'multiCar' | 'gasLeak') => {
    if (scenario === 'criticalMedical') {
      setEmergencyType('Medical');
      setSeverity('Critical');
      setLocation('Central Metro Station, Platform 3');
      setPeopleAffected(1);
      setDescription(
        'Person collapsed on train platform, unresponsive with shallow breathing. Bystanders performing initial CPR.'
      );
      setContactName('Sarah Jenkins');
      setContactNumber('+1 (555) 819-2041');
    } else if (scenario === 'multiCar') {
      setEmergencyType('Accident');
      setSeverity('High');
      setLocation('Expressway 84 Eastbound, Mile Marker 12');
      setPeopleAffected(4);
      setDescription(
        '3-vehicle collision blocking 2 lanes; one driver trapped in driver seat, fluids leaking onto pavement.'
      );
      setContactName('David Thorne');
      setContactNumber('+1 (555) 441-3322');
    } else if (scenario === 'gasLeak') {
      setEmergencyType('Infrastructure');
      setSeverity('Critical');
      setLocation('Oakwood Elementary School, Main Boiler Room');
      setPeopleAffected(15);
      setDescription(
        'Overwhelming smell of natural gas detected in basement. Evacuation of wing underway; sparking furnace nearby.'
      );
      setContactName('Principal Vance');
      setContactNumber('+1 (555) 902-1144');
    }
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>

          {/* Quick Demo Pre-fill for reviewers */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
              Hackathon Presets:
            </span>
            <button
              type="button"
              onClick={() => applyDemoScenario('criticalMedical')}
              className="text-[11px] px-2 py-1 rounded bg-rose-950/70 text-rose-300 border border-rose-800/80 hover:bg-rose-900 transition-colors"
            >
              Critical Medical
            </button>
            <button
              type="button"
              onClick={() => applyDemoScenario('multiCar')}
              className="text-[11px] px-2 py-1 rounded bg-amber-950/70 text-amber-300 border border-amber-800/80 hover:bg-amber-900 transition-colors hidden sm:inline-block"
            >
              Vehicle Crash
            </button>
          </div>
        </div>

        {/* Title Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6 shadow-xl">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-rose-900/40 border border-rose-700/50 rounded-lg text-rose-400 flex-shrink-0">
              <AlertOctagon className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-1">
                Report an Emergency
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                Provide accurate details. CivicSOS AI immediately triages your report and alerts
                available emergency medical, fire, or tactical units.
              </p>
            </div>
          </div>
        </div>

        {/* Global Error Banner if any */}
        {Object.keys(errors).length > 0 && (
          <div className="mb-6 p-4 rounded-lg bg-rose-950/80 border border-rose-700 text-rose-200 text-sm">
            <p className="font-semibold mb-1">Please correct the following fields:</p>
            <ul className="list-disc list-inside space-y-0.5 text-xs text-rose-300">
              {Object.values(errors).map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* The Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Emergency Type */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-sm">
            <label className="block text-sm font-bold text-white mb-1">
              1. Emergency Type <span className="text-rose-400">*</span>
            </label>
            <p className="text-xs text-slate-400 mb-4">
              Select the primary nature of the incident to dispatch appropriate specialized teams.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {EMERGENCY_TYPES.map((item) => {
                const Icon = item.icon;
                const isSelected = emergencyType === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => {
                      setEmergencyType(item.type);
                      if (errors.emergencyType) setErrors((prev) => ({ ...prev, emergencyType: '' }));
                    }}
                    className={`flex flex-col items-start p-3.5 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'bg-rose-950/60 border-rose-500 ring-2 ring-rose-500/80 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div
                      className={`p-2 rounded mb-2 ${
                        isSelected ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-sm text-white mb-0.5">{item.label}</span>
                    <span className="text-[11px] text-slate-400 line-clamp-2 leading-tight">
                      {item.description}
                    </span>
                  </button>
                );
              })}
            </div>
            {errors.emergencyType && (
              <p className="text-xs text-rose-400 mt-2 font-medium">{errors.emergencyType}</p>
            )}
          </div>

          {/* 2. Severity Level */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-sm">
            <label className="block text-sm font-bold text-white mb-1">
              2. Estimated Severity <span className="text-rose-400">*</span>
            </label>
            <p className="text-xs text-slate-400 mb-4">
              Indicate the immediate threat to life and physical safety.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {SEVERITY_LEVELS.map((item) => {
                const isSelected = severity === item.level;
                return (
                  <button
                    key={item.level}
                    type="button"
                    onClick={() => {
                      setSeverity(item.level);
                      if (errors.severity) setErrors((prev) => ({ ...prev, severity: '' }));
                    }}
                    className={`flex flex-col items-start p-3.5 rounded-lg border text-left transition-all ${
                      isSelected
                        ? item.selectedClass
                        : `bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800/70`
                    }`}
                  >
                    <span className="font-bold text-sm block mb-1">{item.label}</span>
                    <span className="text-[11px] text-slate-400 leading-tight">{item.sub}</span>
                  </button>
                );
              })}
            </div>
            {errors.severity && (
              <p className="text-xs text-rose-400 mt-2 font-medium">{errors.severity}</p>
            )}
          </div>

          {/* 3. Location & Affected Count */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-bold text-white">
                  3. Exact Location <span className="text-rose-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  className="flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 transition-colors"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Use Current Location</span>
                </button>
              </div>
              <div className="relative">
                <MapPin className="w-5 h-5 absolute left-3 top-3 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    if (errors.location) setErrors((prev) => ({ ...prev, location: '' }));
                  }}
                  placeholder="Street address, cross streets, station name, or landmark..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
              {errors.location && (
                <p className="text-xs text-rose-400 mt-1.5 font-medium">{errors.location}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-white mb-1">
                Number of People Affected <span className="text-rose-400">*</span>
              </label>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-slate-700 rounded-lg bg-slate-950 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setPeopleAffected((prev) => Math.max(1, prev - 1))}
                    className="px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    -
                  </button>
                  <span className="w-12 text-center text-sm font-mono font-bold text-white">
                    {peopleAffected}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPeopleAffected((prev) => prev + 1)}
                    className="px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    +
                  </button>
                </div>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Users className="w-4 h-4 text-slate-500" />
                  <span>Individual(s) requiring immediate attention or assistance</span>
                </span>
              </div>
              {errors.peopleAffected && (
                <p className="text-xs text-rose-400 mt-1.5 font-medium">{errors.peopleAffected}</p>
              )}
            </div>
          </div>

          {/* 4. Incident Description */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-sm">
            <label className="block text-sm font-bold text-white mb-1">
              4. Description of Emergency <span className="text-rose-400">*</span>
            </label>
            <p className="text-xs text-slate-400 mb-2">
              Describe what is happening right now: visible injuries, hazards, hazards spreading, or
              trapped persons.
            </p>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
              }}
              placeholder="e.g. Person collapsed near the escalator, not breathing; bystanders starting CPR. Need defibrillator and paramedics."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            {errors.description && (
              <p className="text-xs text-rose-400 mt-1.5 font-medium">{errors.description}</p>
            )}
          </div>

          {/* 5. Optional Contact Information */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-sm">
            <h3 className="text-sm font-bold text-white mb-1">5. Contact Information (Optional)</h3>
            <p className="text-xs text-slate-400 mb-4">
              Allows dispatchers to contact you directly for updates or location verification.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Your Name</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-slate-500 pointer-events-none" />
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Contact Phone</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-500 pointer-events-none" />
                  <input
                    type="tel"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="(555) 000-0000"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:bg-rose-800 text-white font-bold text-base shadow-xl shadow-rose-950/60 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Transmitting Emergency to Dispatch & AI Triage...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Submit Emergency Immediately</span>
                </>
              )}
            </button>
            <p className="text-center text-xs text-slate-400 mt-3">
              If life is in immediate extreme danger, also contact local primary emergency services (911/112).
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
