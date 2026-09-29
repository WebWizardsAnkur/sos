import { AIAnalysisResult, EmergencyType, PriorityLevel, SeverityLevel } from '../types/incident.ts';

export function runDeterministicClassification(
  emergencyType: EmergencyType,
  severity: SeverityLevel,
  peopleAffected: number,
  description: string
): AIAnalysisResult {
  const descLower = description.toLowerCase();

  // 1. Determine Category
  let category = 'Public Safety Incident';
  switch (emergencyType) {
    case 'Medical':
      if (
        descLower.includes('heart') ||
        descLower.includes('cardiac') ||
        descLower.includes('unconscious') ||
        descLower.includes('breathing') ||
        descLower.includes('stroke')
      ) {
        category = 'Acute Life-Threat / Critical Resuscitation';
      } else if (
        descLower.includes('blood') ||
        descLower.includes('bleed') ||
        descLower.includes('fracture') ||
        descLower.includes('fall')
      ) {
        category = 'Severe Trauma / Physical Injury';
      } else {
        category = 'Urgent Pre-Hospital Medical Care';
      }
      break;

    case 'Fire':
      if (
        descLower.includes('building') ||
        descLower.includes('apartment') ||
        descLower.includes('roof') ||
        descLower.includes('structural')
      ) {
        category = 'Structural Fire / Trapped Inhabitants Hazard';
      } else if (
        descLower.includes('gas') ||
        descLower.includes('chemical') ||
        descLower.includes('tank') ||
        descLower.includes('explosion')
      ) {
        category = 'Hazmat Chemical Fire / Explosive Threat';
      } else {
        category = 'Active Fire Incident & Smoke Inhalation Hazard';
      }
      break;

    case 'Accident':
      if (
        descLower.includes('highway') ||
        descLower.includes('bus') ||
        descLower.includes('pileup') ||
        descLower.includes('rollover') ||
        peopleAffected >= 3
      ) {
        category = 'Multi-Vehicle Transit Collision / Extrication Required';
      } else if (descLower.includes('pedestrian') || descLower.includes('cyclist')) {
        category = 'Pedestrian Vehicle Collision / Trauma Response';
      } else {
        category = 'Roadway Traffic Incident / Safety Hazard';
      }
      break;

    case 'Flood':
      if (
        descLower.includes('rising') ||
        descLower.includes('trapped') ||
        descLower.includes('submerged') ||
        descLower.includes('current')
      ) {
        category = 'Flash Flood / Rapid Water Rescue';
      } else {
        category = 'Urban Water Inundation & Property Threat';
      }
      break;

    case 'Infrastructure':
      if (
        descLower.includes('gas') ||
        descLower.includes('leak') ||
        descLower.includes('smell')
      ) {
        category = 'Hazardous Gas Pipeline Rupture';
      } else if (
        descLower.includes('wire') ||
        descLower.includes('power') ||
        descLower.includes('electric') ||
        descLower.includes('pole')
      ) {
        category = 'Downed High-Voltage Power Lines / Electrocution Risk';
      } else if (
        descLower.includes('bridge') ||
        descLower.includes('collapse') ||
        descLower.includes('sinkhole')
      ) {
        category = 'Critical Structural Collapse / Transportation Artery Failure';
      } else {
        category = 'Municipal Infrastructure System Malfunction';
      }
      break;

    case 'Other':
    default:
      category = 'Unclassified Community Emergency Dispatch';
      break;
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
    descLower.includes('electrocution');

  if (severity === 'Critical' || (peopleAffected >= 5 && severity === 'High') || isLifeThreatKeyword) {
    priority = 'P1 - Critical';
    if (peopleAffected > 1) {
      reason = `Critical risk to human life with ${peopleAffected} people directly affected. Immediate emergency response units dispatched.`;
    } else if (isLifeThreatKeyword) {
      reason = `Immediate life-safety hazard identified from reported conditions ('${descLower.slice(0, 45)}...'). High urgency response required.`;
    } else {
      reason = `Critical severity emergency reported in municipal area requiring immediate priority dispatch.`;
    }
  } else if (severity === 'High' || peopleAffected >= 3) {
    priority = 'P2 - High';
    reason = `High risk incident involving ${peopleAffected} affected individual(s). Rapid tactical intervention required to prevent escalation.`;
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
    source: 'rule-engine',
  };
}
