import type { SymptomType } from '@/features/symptoms/types';
import type { AdvancedAllergyProfile } from '@/features/insights/types';

export interface ExportSymptomLog {
  id: string;
  loggedAt: string;
  severity: number;
  symptoms: SymptomType[];
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  medications: string | null;
  locationLabel: string | null;
  // Pollen (grains/m³, from log_environment)
  grassPollen: number | null;
  treePollen: number | null;
  weedPollen: number | null;
  alderPollen: number | null;
  birchPollen: number | null;
  olivePollen: number | null;
  mugwortPollen: number | null;
  ragweedPollen: number | null;
  // Air quality
  pm25: number | null;
  pm10: number | null;
  ozone: number | null;
  no2: number | null;
  so2: number | null;
  uvIndex: number | null;
  dust: number | null;
  // Weather
  temperature: number | null;
  humidity: number | null;
  windSpeed: number | null;
  precipitationProbability: number | null;
}

export interface ExportSummary {
  generatedAt: string;
  fromDate: string;
  toDate: string;
  totalLogs: number;
  worstDays: Array<{ date: string; maxSeverity: number }>;
  mostCommonSymptoms: SymptomType[];
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function symptomLabel(s: SymptomType): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function fmt(val: number | null, unit = '', decimals = 0): string {
  if (val == null) return '—';
  return `${val.toFixed(decimals)}${unit}`;
}

function confidenceLabel(r2: number): string {
  if (r2 >= 0.50) return 'Very confident';
  if (r2 >= 0.40) return 'Confident';
  if (r2 >= 0.30) return 'Moderate confidence';
  return 'Still learning';
}

function correlationStrengthLabel(r: number): string {
  const abs = Math.abs(r);
  if (abs >= 0.7) return 'high confidence';
  if (abs >= 0.5) return 'moderate confidence';
  if (abs >= 0.3) return 'still being confirmed — needs more data';
  return 'weak signal';
}

function allergyProfileSection(profile: AdvancedAllergyProfile): string {
  const primaryTrigger = profile.primaryTrigger;
  const secondaryTrigger = profile.triggers.find((t) => t.isSecondary) ?? null;
  const visibleTriggers = [
    ...(primaryTrigger ? [{ ...primaryTrigger, role: 'primary' as const }] : []),
    ...(secondaryTrigger ? [{ ...secondaryTrigger, role: 'secondary' as const }] : []),
  ];

  const triggersHtml = visibleTriggers.map((trigger) => {
    const pct = Math.round(Math.abs(trigger.pearsonR) * 100);
    const barColor = trigger.role === 'primary' ? '#f59e0b' : '#60a5fa';
    const badge =
      trigger.role === 'primary'
        ? '<span class="badge-primary">Primary trigger</span>'
        : '<span class="badge-secondary">Secondary trigger</span>';
    return `
    <div class="trigger-row">
      <div class="trigger-header">
        <span class="trigger-label">${trigger.label}</span>
        ${badge}
      </div>
      <div class="trigger-bar-bg">
        <div class="trigger-bar-fill" style="width:${pct}%;background:${barColor}"></div>
      </div>
      <div class="trigger-meta">${pct}% correlation &nbsp;·&nbsp; ${correlationStrengthLabel(trigger.pearsonR)}<sup>*</sup></div>
    </div>`;
  }).join('');

  const findings: string[] = [];
  if (profile.insightSentence) findings.push(profile.insightSentence);
  if (
    profile.medicationEffect?.hasEnoughData &&
    profile.medicationEffect.reductionPercent > 0
  ) {
    const med = profile.medicationEffect;
    findings.push(
      `${med.primaryTriggerLabel}: medication was associated with ${Math.round(med.reductionPercent)}% lower symptom severity on high-pollen days.`,
    );
  }

  const findingsHtml = findings.length > 0 ? `
    <div class="findings-section">
      <div class="findings-title">Key findings</div>
      <ul>${findings.map((f) => `<li>${f}</li>`).join('')}</ul>
    </div>` : '';

  return `
  <div class="section">
    <div class="section-title">Allergy profile — what the model learnt</div>
    <p class="profile-subtitle">Based on ${profile.dataPoints} logged entries cross-referenced with pollen and air quality data</p>
    ${triggersHtml}
    ${findingsHtml}
  </div>`;
}

function hasEnvData(log: ExportSymptomLog): boolean {
  return (
    log.grassPollen != null || log.treePollen != null || log.weedPollen != null ||
    log.alderPollen != null || log.birchPollen != null || log.olivePollen != null ||
    log.mugwortPollen != null || log.ragweedPollen != null ||
    log.pm25 != null || log.pm10 != null || log.ozone != null ||
    log.uvIndex != null || log.temperature != null || log.humidity != null
  );
}

function envRow(log: ExportSymptomLog): string {
  if (!hasEnvData(log)) return '';

  const pollenParts: string[] = [];
  if (log.grassPollen != null) pollenParts.push(`Grass: ${fmt(log.grassPollen)}`);
  if (log.treePollen != null) pollenParts.push(`Tree: ${fmt(log.treePollen)}`);
  if (log.weedPollen != null) pollenParts.push(`Weed: ${fmt(log.weedPollen)}`);
  if (log.alderPollen != null) pollenParts.push(`Alder: ${fmt(log.alderPollen)}`);
  if (log.birchPollen != null) pollenParts.push(`Birch: ${fmt(log.birchPollen)}`);
  if (log.olivePollen != null) pollenParts.push(`Olive: ${fmt(log.olivePollen)}`);
  if (log.mugwortPollen != null) pollenParts.push(`Mugwort: ${fmt(log.mugwortPollen)}`);
  if (log.ragweedPollen != null) pollenParts.push(`Ragweed: ${fmt(log.ragweedPollen)}`);

  const aqParts: string[] = [];
  if (log.pm25 != null) aqParts.push(`PM2.5: ${fmt(log.pm25, ' µg/m³', 1)}`);
  if (log.pm10 != null) aqParts.push(`PM10: ${fmt(log.pm10, ' µg/m³', 1)}`);
  if (log.ozone != null) aqParts.push(`O₃: ${fmt(log.ozone, ' µg/m³', 1)}`);
  if (log.no2 != null) aqParts.push(`NO₂: ${fmt(log.no2, ' µg/m³', 1)}`);
  if (log.so2 != null) aqParts.push(`SO₂: ${fmt(log.so2, ' µg/m³', 1)}`);
  if (log.uvIndex != null) aqParts.push(`UV: ${fmt(log.uvIndex, '', 1)}`);
  if (log.dust != null) aqParts.push(`Dust: ${fmt(log.dust, ' µg/m³', 1)}`);

  const wxParts: string[] = [];
  if (log.temperature != null) wxParts.push(`Temp: ${fmt(log.temperature, '°C', 1)}`);
  if (log.humidity != null) wxParts.push(`Humidity: ${fmt(log.humidity, '%')}`);
  if (log.windSpeed != null) wxParts.push(`Wind: ${fmt(log.windSpeed, ' km/h', 1)}`);
  if (log.precipitationProbability != null) wxParts.push(`Rain: ${fmt(log.precipitationProbability, '%')}`);

  const sections: string[] = [];
  if (pollenParts.length > 0) sections.push(`🌿 Pollen (grains/m³): ${pollenParts.join(' · ')}`);
  if (aqParts.length > 0) sections.push(`💨 Air quality: ${aqParts.join(' · ')}`);
  if (wxParts.length > 0) sections.push(`🌡 Weather: ${wxParts.join(' · ')}`);

  return `<tr class="env-row"><td colspan="6"><div class="env-data">${sections.join('<br>')}</div></td></tr>`;
}

export function exportDataToPdfHtml(
  logs: ExportSymptomLog[],
  summary: ExportSummary,
  allergyProfile?: AdvancedAllergyProfile | null,
): string {
  const worstDaysHtml = summary.worstDays
    .map((d) => `<li>${formatDate(d.date + 'T00:00:00')} — severity ${d.maxSeverity}/10</li>`)
    .join('');

  const topSymptomsHtml = summary.mostCommonSymptoms
    .map((s) => `<span class="tag">${symptomLabel(s)}</span>`)
    .join(' ');

  const rowsHtml = logs
    .map((log) => {
      const sevClass = log.severity <= 3 ? 'low' : log.severity <= 6 ? 'med' : 'high';
      const symptomsText = log.symptoms.map(symptomLabel).join(' · ') || '—';

      const pollenParts: string[] = [];
      if (log.grassPollen != null) pollenParts.push(`Grass ${fmt(log.grassPollen)} g/m³`);
      if (log.treePollen != null) pollenParts.push(`Tree ${fmt(log.treePollen)} g/m³`);
      if (log.weedPollen != null) pollenParts.push(`Weed ${fmt(log.weedPollen)} g/m³`);
      if (log.alderPollen != null) pollenParts.push(`Alder ${fmt(log.alderPollen)} g/m³`);
      if (log.birchPollen != null) pollenParts.push(`Birch ${fmt(log.birchPollen)} g/m³`);
      if (log.olivePollen != null) pollenParts.push(`Olive ${fmt(log.olivePollen)} g/m³`);
      if (log.mugwortPollen != null) pollenParts.push(`Mugwort ${fmt(log.mugwortPollen)} g/m³`);
      if (log.ragweedPollen != null) pollenParts.push(`Ragweed ${fmt(log.ragweedPollen)} g/m³`);

      const aqParts: string[] = [];
      if (log.pm25 != null) aqParts.push(`PM2.5 ${fmt(log.pm25, '', 1)} µg/m³`);
      if (log.pm10 != null) aqParts.push(`PM10 ${fmt(log.pm10, '', 1)} µg/m³`);
      if (log.ozone != null) aqParts.push(`O₃ ${fmt(log.ozone, '', 1)} µg/m³`);
      if (log.no2 != null) aqParts.push(`NO₂ ${fmt(log.no2, '', 1)} µg/m³`);
      if (log.so2 != null) aqParts.push(`SO₂ ${fmt(log.so2, '', 1)} µg/m³`);
      if (log.uvIndex != null) aqParts.push(`UV index ${fmt(log.uvIndex, '', 1)}`);
      if (log.dust != null) aqParts.push(`Dust ${fmt(log.dust, '', 1)} µg/m³`);

      const wxParts: string[] = [];
      if (log.temperature != null) wxParts.push(`Temp ${fmt(log.temperature, '°C', 1)}`);
      if (log.humidity != null) wxParts.push(`Humidity ${fmt(log.humidity, '%')}`);
      if (log.windSpeed != null) wxParts.push(`Wind ${fmt(log.windSpeed, ' km/h', 1)}`);
      if (log.precipitationProbability != null) wxParts.push(`Rain ${fmt(log.precipitationProbability, '%')}`);

      const notesLine = [log.medications, log.notes].filter(Boolean).join(' · ');

      return `
      <tr class="log-row">
        <td class="col-datetime">
          <div class="date-main">${formatDate(log.loggedAt)}</div>
          <div class="date-time">${formatTime(log.loggedAt)}</div>
        </td>
        <td class="col-severity">
          <span class="sev-badge sev-${sevClass}">${log.severity}/10</span>
        </td>
        <td class="col-detail">
          ${log.locationLabel ? `<div class="location-line">📍 ${log.locationLabel}</div>` : ''}
          <div class="symptom-line">${symptomsText}</div>
          ${pollenParts.length > 0 ? `<div class="env-inline"><span class="env-group-label">Pollen</span> ${pollenParts.join(' &nbsp;·&nbsp; ')}</div>` : ''}
          ${aqParts.length > 0 ? `<div class="env-inline"><span class="env-group-label">Air quality</span> ${aqParts.join(' &nbsp;·&nbsp; ')}</div>` : ''}
          ${wxParts.length > 0 ? `<div class="env-inline"><span class="env-group-label">Weather</span> ${wxParts.join(' &nbsp;·&nbsp; ')}</div>` : ''}
          ${notesLine ? `<div class="notes-line">${notesLine}</div>` : ''}
        </td>
      </tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Allergy Report</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, Arial, sans-serif; color: #1a1a1a; padding: 32px; font-size: 13px; }
    .report-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #9ca3af; margin-bottom: 4px; }
    .header { border-bottom: 2px solid #3b82f6; padding-bottom: 16px; margin-bottom: 16px; }
    .header h1 { font-size: 24px; color: #3b82f6; font-weight: 800; }
    .header p { color: #6b7280; margin-top: 4px; font-size: 12px; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.08em; color: #6b7280; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
    .summary-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 12px; }
    .summary-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
    .summary-card .value { font-size: 22px; font-weight: 700; color: #111827; }
    .summary-card .label { font-size: 11px; color: #6b7280; margin-top: 2px; }
    .inline-disclaimer { font-size: 10.5px; color: #9ca3af; font-style: italic; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px 12px; margin-bottom: 20px; }
    .tag { background: #eff6ff; color: #2563eb; border-radius: 4px; padding: 2px 8px; font-size: 12px; margin-right: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #f3f4f6; text-align: left; padding: 8px 12px; font-weight: 600; color: #374151; font-size: 11.5px; }
    td { padding: 10px 12px; vertical-align: top; border-top: 1px solid #e5e7eb; }
    .log-row:nth-child(even) td { background: #fafafa; }
    .col-datetime { width: 130px; }
    .date-main { font-size: 12px; font-weight: 600; color: #111827; }
    .date-time { font-size: 11px; color: #9ca3af; margin-top: 2px; }
    .col-severity { width: 64px; text-align: center; }
    .sev-badge { display: inline-block; border-radius: 5px; padding: 3px 8px; font-size: 12px; font-weight: 700; }
    .sev-low { background: #dcfce7; color: #15803d; }
    .sev-med { background: #fef3c7; color: #b45309; }
    .sev-high { background: #fee2e2; color: #b91c1c; }
    .col-detail { }
    .location-line { font-size: 10px; color: #9ca3af; margin-bottom: 3px; }
    .symptom-line { font-size: 12px; color: #111827; font-weight: 500; }
    .env-inline { font-size: 10.5px; color: #6b7280; margin-top: 4px; }
    .env-group-label { font-weight: 600; color: #9ca3af; text-transform: uppercase; font-size: 9.5px; letter-spacing: 0.06em; margin-right: 4px; }
    .notes-line { font-size: 10.5px; color: #6b7280; font-style: italic; margin-top: 3px; }
    ul { padding-left: 20px; }
    li { margin-bottom: 4px; }
    .profile-subtitle { font-size: 11.5px; color: #6b7280; margin-bottom: 14px; }
    .trigger-row { margin-bottom: 14px; }
    .trigger-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px; }
    .trigger-label { font-size: 13px; font-weight: 600; color: #111827; }
    .badge-primary { background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; border-radius: 4px; padding: 2px 8px; font-size: 11px; font-weight: 600; }
    .badge-secondary { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; border-radius: 4px; padding: 2px 8px; font-size: 11px; }
    .trigger-bar-bg { height: 7px; background: #f3f4f6; border-radius: 4px; overflow: hidden; margin-bottom: 4px; }
    .trigger-bar-fill { height: 100%; border-radius: 4px; }
    .trigger-meta { font-size: 10.5px; color: #6b7280; }
    .findings-section { margin-top: 14px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px 14px; }
    .findings-title { font-size: 11px; font-weight: 700; color: #374151; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.07em; }
    .footnote { margin-top: 28px; border-top: 1px solid #e5e7eb; padding-top: 14px; font-size: 10px; color: #9ca3af; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="header">
    <div class="report-label">Local Allergies &nbsp;·&nbsp; Personal Report</div>
    <h1>Allergy Report</h1>
    <p>Generated ${formatDate(summary.generatedAt)} &nbsp;·&nbsp; ${formatDate(summary.fromDate + 'T00:00:00')} – ${formatDate(summary.toDate + 'T00:00:00')}</p>
  </div>

  <div class="inline-disclaimer">For informational purposes only. Please consult your allergist or physician for medical advice. Local Allergies does not provide medical diagnoses.</div>

  ${allergyProfile ? allergyProfileSection(allergyProfile) : ''}

  ${summary.worstDays.length > 0 ? `<div class="section">
    <div class="section-title">Worst Days</div>
    <ul>${worstDaysHtml}</ul>
  </div>` : ''}

  ${summary.mostCommonSymptoms.length > 0 ? `<div class="section">
    <div class="section-title">Most Common Symptoms</div>
    <div style="margin-top:4px">${topSymptomsHtml}</div>
  </div>` : ''}

  <div class="section">
    <div class="section-title">Symptom Log</div>
    <table>
      <thead>
        <tr>
          <th>Date &amp; time</th><th>Severity</th><th>Symptoms &amp; environment</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
  </div>

  ${allergyProfile ? `<div class="footnote">
    * <strong>Profile confidence</strong> reflects the statistical model fit (R²) between your logged symptoms and environmental data. A score of 40% or above means the identified triggers account for a meaningful share of your day-to-day symptom variation — a threshold considered significant in published environmental health research. Scores below 40% indicate the model is still learning and results should be treated as preliminary.<br><br>
    <strong>Important:</strong> This allergy profile is generated automatically by a statistical algorithm. It has not been reviewed by a clinician and does not constitute a medical diagnosis, clinical assessment, or personalised medical advice. Local Allergies Limited accepts no liability for decisions made on the basis of this report. Always consult a qualified allergist or physician before making any changes to your treatment, medication, or lifestyle.
  </div>` : ''}
</body>
</html>`;
}
