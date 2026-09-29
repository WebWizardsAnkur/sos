import { AIAnalysisResult, EmergencyType, PriorityLevel, SeverityLevel } from '../types/incident.ts';

export function runDeterministicClassification(
  emergencyType: EmergencyType,
  severity: SeverityLevel,
  peopleAffected: number,
  description: string,
  location?: string
): AIAnalysisResult {
  const descLower = description.toLowerCase();
  const locLower = (location || '').toLowerCase();

  // 1. Determine Category & Suggested Team
  let category = 'Public Safety Incident';
  let suggestedTeam = 'General Operations';
  let immediateAction = 'Deploy emergency dispatch to assess scene status and establish safety perimeter.';
  let riskConsideration = 'Potential public safety exposure; ongoing situation monitoring required.';
  const keyRiskFactors: string[] = [];

  switch (emergencyType) {
    case 'Medical':
      suggestedTeam = 'Medical Response';
      if (
        descLower.includes('heart') ||
        descLower.includes('cardiac') ||
        descLower.includes('unconscious') ||
        descLower.includes('breathing') ||
        descLower.includes('stroke') ||
        descLower.includes('cpr')
      ) {
        category = 'Acute Life-Threat / Critical Resuscitation';
        immediateAction = 'Dispatch Advanced Life Support (ALS) unit immediately; prioritize rapid airway and cardiac resuscitation.';
        riskConsideration = 'Immediate life-threatening hypoxia, cardiac arrest, or neurological deterioration.';
        keyRiskFactors.push('Impaired airway or cardiac compromise');
        keyRiskFactors.push('Rapid patient deterioration risk');
      } else if (
        descLower.includes('blood') ||
        descLower.includes('bleed') ||
        descLower.includes('fracture') ||
        descLower.includes('fall') ||
        descLower.includes('burn')
      ) {
        category = 'Severe Trauma / Physical Injury';
        immediateAction = 'Dispatch paramedic trauma crew with hemorrhage control and immobilization equipment.';
        riskConsideration = 'Hemorrhagic shock and secondary orthopedic or spinal damage.';
        keyRiskFactors.push('Hemorrhagic shock or physical trauma');
      } else {
        category = 'Urgent Pre-Hospital Medical Care';
        immediateAction = 'Deploy emergency medical technician (EMT) unit for patient evaluation and transport.';
        riskConsideration = 'Escalation of underlying acute medical condition.';
        keyRiskFactors.push('Acute clinical distress');
      }
      break;

    case 'Fire':
      suggestedTeam = 'Fire & Rescue';
      if (
        descLower.includes('building') ||
        descLower.includes('apartment') ||
        descLower.includes('roof') ||
        descLower.includes('structural') ||
        descLower.includes('school') ||
        descLower.includes('hospital')
      ) {
        category = 'Structural Fire / Trapped Inhabitants Hazard';
        immediateAction = 'Dispatch 1st-alarm structural fire engines, ladder company, and search/evacuation teams immediately.';
        riskConsideration = 'Structural collapse, smoke asphyxiation, and trapped occupants in multi-level structure.';
        keyRiskFactors.push('Active thermal spreading in occupied structure');
        keyRiskFactors.push('Severe smoke toxicity and asphyxiation risk');
      } else if (
        descLower.includes('gas') ||
        descLower.includes('chemical') ||
        descLower.includes('tank') ||
        descLower.includes('explosion') ||
        descLower.includes('battery')
      ) {
        category = 'Hazmat Chemical Fire / Explosive Threat';
        immediateAction = 'Dispatch Specialized Hazmat suppression unit and isolate a minimum 500ft exclusion perimeter.';
        riskConsideration = 'Explosion, toxic vapor plumes, and water-reactive chemical combustion.';
        keyRiskFactors.push('Explosive overpressure or secondary combustion');
        keyRiskFactors.push('Airborne hazardous vapor contamination');
      } else {
        category = 'Active Fire Incident & Smoke Inhalation Hazard';
        immediateAction = 'Deploy primary fire suppression engines and establish water supply lines.';
        riskConsideration = 'Rapid flame spreading and smoke inhalation to surrounding bystanders.';
        keyRiskFactors.push('Uncontrolled fire spread to adjacent assets');
      }
      break;

    case 'Accident':
      suggestedTeam = 'Police / Public Safety';
      if (
        descLower.includes('highway') ||
        descLower.includes('expressway') ||
        descLower.includes('bus') ||
        descLower.includes('pileup') ||
        descLower.includes('rollover') ||
        descLower.includes('trapped') ||
        peopleAffected >= 3
      ) {
        category = 'Multi-Vehicle Transit Collision / Extrication Required';
        suggestedTeam = 'Fire & Rescue'; // Heavy extrication needs Fire/Rescue
        immediateAction = 'Deploy hydraulic heavy rescue extrication squad, traffic closure units, and multiple ambulances.';
        riskConsideration = 'Pinned vehicle occupants, fuel spill ignition, and secondary high-speed pileups.';
        keyRiskFactors.push('Victim vehicular entrapment requiring hydraulic tools');
        keyRiskFactors.push('Hazardous high-speed roadway blockage');
      } else if (descLower.includes('pedestrian') || descLower.includes('cyclist')) {
        category = 'Pedestrian Vehicle Collision / Trauma Response';
        suggestedTeam = 'Medical Response';
        immediateAction = 'Dispatch rapid paramedic trauma unit and police traffic reconstruction.';
        riskConsideration = 'Unprotected blunt force trauma with severe head or internal injury.';
        keyRiskFactors.push('Direct blunt force impact without vehicle protection');
      } else {
        category = 'Roadway Traffic Incident / Safety Hazard';
        immediateAction = 'Dispatch traffic safety unit to clear lanes, direct vehicular flow, and assist motorists.';
        riskConsideration = 'Traffic congestion, secondary collisions, and vehicular fluid leakage.';
        keyRiskFactors.push('Traffic corridor disruption');
      }
      break;

    case 'Flood':
      suggestedTeam = 'Disaster Response';
      if (
        descLower.includes('rising') ||
        descLower.includes('trapped') ||
        descLower.includes('submerged') ||
        descLower.includes('roof') ||
        descLower.includes('current') ||
        descLower.includes('underpass')
      ) {
        category = 'Flash Flood / Rapid Water Rescue';
        immediateAction = 'Mobilize swiftwater rescue boats, tactical flotation teams, and high-clearance rescue vehicles.';
        riskConsideration = 'Victims swept away by rapid hydrological currents or trapped in rapidly filling vehicles.';
        keyRiskFactors.push('Surging hydrological water velocity and drowning hazard');
        keyRiskFactors.push('Submerged vehicular entrapment');
      } else {
        category = 'Urban Water Inundation & Property Threat';
        immediateAction = 'Dispatch municipal water pumping units, public works barriers, and civil engineering teams.';
        riskConsideration = 'Foundation undermining, electrical hazards in flooded basements, and sewage contamination.';
        keyRiskFactors.push('Basement and ground infrastructure inundation');
      }
      break;

    case 'Infrastructure':
      suggestedTeam = 'Infrastructure Response';
      if (
        descLower.includes('gas') ||
        descLower.includes('leak') ||
        descLower.includes('smell')
      ) {
        category = 'Hazardous Gas Pipeline Rupture';
        immediateAction = 'Dispatch utility emergency valve shutoff crew, evacuate 3-block radius, and prohibit open flames.';
        riskConsideration = 'Volatile combustible air-gas mixture risking catastrophic vapor cloud explosion.';
        keyRiskFactors.push('Catastrophic flammable gas explosion envelope');
        keyRiskFactors.push('Widespread residential/commercial evacuation required');
      } else if (
        descLower.includes('wire') ||
        descLower.includes('power') ||
        descLower.includes('electric') ||
        descLower.includes('sparking') ||
        descLower.includes('pole')
      ) {
        category = 'Downed High-Voltage Power Lines / Electrocution Risk';
        immediateAction = 'Contact grid control to de-energize feeder circuit; establish cordoned safety zone around all conductive surfaces.';
        riskConsideration = 'High-voltage electrocution via ground potential gradient and arcing to water/metal.';
        keyRiskFactors.push('Lethal ground voltage gradient and arc flash threat');
      } else if (
        descLower.includes('bridge') ||
        descLower.includes('collapse') ||
        descLower.includes('sinkhole')
      ) {
        category = 'Critical Structural Collapse / Transportation Artery Failure';
        immediateAction = 'Implement complete perimeter roadblock and deploy urban search and rescue (USAR) collapse engineers.';
        riskConsideration = 'Progressive catastrophic structural failure and subterranean entrapment.';
        keyRiskFactors.push('Progressive mass structural instability');
      } else {
        category = 'Municipal Infrastructure System Malfunction';
        immediateAction = 'Dispatch civil utility repair crews and establish detour routing.';
        riskConsideration = 'Disruption of municipal water, power, or transportation grids.';
        keyRiskFactors.push('Municipal utility grid interruption');
      }
      break;

    case 'Other':
    default:
      category = 'Unclassified Community Emergency Dispatch';
      suggestedTeam = 'General Operations';
      immediateAction = 'Dispatch patrol supervisor to assess scene hazards, verify situation, and coordinate specialized response.';
      riskConsideration = 'Undetermined environmental or community safety conditions.';
      keyRiskFactors.push('Unverified situational dynamics');
      break;
  }

  // Location-based risk factor evaluation
  if (locLower.includes('metro') || locLower.includes('station') || locLower.includes('transit') || locLower.includes('subway')) {
    keyRiskFactors.push('High-density subterranean transit environment');
  } else if (locLower.includes('school') || locLower.includes('hospital') || locLower.includes('daycare')) {
    keyRiskFactors.push('Vulnerable population sector (pediatric/medical facility)');
  } else if (locLower.includes('highway') || locLower.includes('interstate') || locLower.includes('expressway')) {
    keyRiskFactors.push('High-velocity arterial transportation corridor');
  }

  // People affected risk factor
  if (peopleAffected >= 4) {
    keyRiskFactors.push(`Multiple casualties (${peopleAffected} people impacted)`);
  }

  // 2. Determine Priority & Reason
  let priority: PriorityLevel = 'P3 - Medium';
  let reason = '';

  const isLifeThreatKeyword =
    descLower.includes('unconscious') ||
    descLower.includes('not breathing') ||
    descLower.includes('trapped') ||
    descLower.includes('explosion') ||
    descLower.includes('severe bleeding') ||
    descLower.includes('flames spreading') ||
    descLower.includes('collapse') ||
    descLower.includes('choking') ||
    descLower.includes('electrocution') ||
    descLower.includes('gas leak') ||
    descLower.includes('cardiac');

  if (severity === 'Critical' || (peopleAffected >= 4 && severity === 'High') || isLifeThreatKeyword) {
    priority = 'P1 - Critical';
    if (peopleAffected > 1 && isLifeThreatKeyword) {
      reason = `Large number of people affected (${peopleAffected}) + reported life-threatening symptoms. Immediate tactical intervention required.`;
    } else if (isLifeThreatKeyword) {
      reason = `Reported life-threatening symptoms requiring immediate resuscitation or rescue.`;
    } else {
      reason = `Critical severity reported in public area requiring urgent priority response.`;
    }
    if (!keyRiskFactors.includes('Potential life-threatening condition')) {
      keyRiskFactors.unshift('Potential life-threatening condition');
    }
  } else if (severity === 'High' || peopleAffected >= 3) {
    priority = 'P2 - High';
    reason = `Severe incident involving ${peopleAffected} affected individual(s) with high potential for tactical escalation.`;
    if (!keyRiskFactors.includes('Escalation threat without rapid containment')) {
      keyRiskFactors.push('Escalation threat without rapid containment');
    }
  } else if (severity === 'Medium') {
    priority = 'P3 - Medium';
    reason = `Moderate severity event with localized impact. Standard emergency priority queue assigned.`;
  } else {
    priority = 'P4 - Low';
    reason = `Low-risk localized incident with minimal casualty or safety exposure. Routine queue assigned.`;
  }

  return {
    aiCategory: category,
    priority,
    priorityReason: reason,
    keyRiskFactors: Array.from(new Set(keyRiskFactors)),
    recommendedResponse: {
      immediateAction,
      suggestedTeam,
      riskConsideration,
    },
    suggestedResponseTeam: suggestedTeam,
    source: 'rule-engine',
    sourceNote: 'AI triage unavailable — deterministic emergency rules applied.',
  };
}
