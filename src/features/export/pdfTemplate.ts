import type { SymptomType } from '@/features/symptoms/types';

export interface ExportSymptomLog {
  id: string;
  loggedAt: string;
  severity: number;
  symptoms: SymptomType[];
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  medications: string | null;
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

export function exportDataToPdfHtml(logs: ExportSymptomLog[], summary: ExportSummary): string {
  const worstDaysHtml = summary.worstDays
    .map((d) => `<li>${formatDate(d.date + 'T00:00:00')} — severity ${d.maxSeverity}/10</li>`)
    .join('');

  const topSymptomsHtml = summary.mostCommonSymptoms
    .map((s) => `<span class="tag">${symptomLabel(s)}</span>`)
    .join(' ');

  const rowsHtml = logs
    .map((log) => {
      const sevClass = log.severity <= 3 ? 'low' : log.severity <= 6 ? 'med' : 'high';
      return `
      <tr class="log-row">
        <td>${formatDate(log.loggedAt)}</td>
        <td>${formatTime(log.loggedAt)}</td>
        <td class="severity-${sevClass}">${log.severity}/10</td>
        <td>${log.symptoms.map(symptomLabel).join(', ') || '—'}</td>
        <td>${log.medications ?? '—'}</td>
        <td>${log.notes ?? '—'}</td>
      </tr>
      ${envRow(log)}`;
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
    .header { border-bottom: 2px solid #3b82f6; padding-bottom: 16px; margin-bottom: 24px; }
    .header h1 { font-size: 22px; color: #3b82f6; }
    .header p { color: #6b7280; margin-top: 4px; font-size: 12px; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.08em; color: #6b7280; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
    .summary-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
    .summary-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
    .summary-card .value { font-size: 22px; font-weight: 700; color: #111827; }
    .summary-card .label { font-size: 11px; color: #6b7280; margin-top: 2px; }
    .tag { background: #eff6ff; color: #2563eb; border-radius: 4px; padding: 2px 8px; font-size: 12px; margin-right: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
    th { background: #f3f4f6; text-align: left; padding: 8px 10px; font-weight: 600; color: #374151; }
    td { padding: 7px 10px; vertical-align: top; }
    .log-row td { border-top: 1px solid #e5e7eb; }
    .log-row:nth-child(4n+1) td, .log-row:nth-child(4n+1) + .env-row td { background: #fafafa; }
    .env-row td { padding: 2px 10px 8px 10px; }
    .env-data { font-size: 10.5px; color: #6b7280; line-height: 1.6; background: #f9fafb;
      border-radius: 4px; padding: 6px 10px; }
    .severity-low { color: #16a34a; font-weight: 600; }
    .severity-med { color: #d97706; font-weight: 600; }
    .severity-high { color: #dc2626; font-weight: 600; }
    .disclaimer { margin-top: 32px; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 12px; }
    ul { padding-left: 20px; }
    li { margin-bottom: 4px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>SmartAllergies — Allergy Report</h1>
    <p>Generated ${formatDate(summary.generatedAt)} &nbsp;·&nbsp; Period: ${formatDate(summary.fromDate + 'T00:00:00')} – ${formatDate(summary.toDate + 'T00:00:00')}</p>
  </div>

  <div class="section">
    <div class="section-title">Summary</div>
    <div class="summary-grid">
      <div class="summary-card">
        <div class="value">${summary.totalLogs}</div>
        <div class="label">Total entries</div>
      </div>
      <div class="summary-card">
        <div class="value">${summary.worstDays[0]?.maxSeverity ?? '—'}/10</div>
        <div class="label">Worst severity</div>
      </div>
      <div class="summary-card">
        <div class="value">${summary.mostCommonSymptoms.length}</div>
        <div class="label">Distinct symptoms</div>
      </div>
    </div>
  </div>

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
          <th>Date</th><th>Time</th><th>Severity</th><th>Symptoms</th><th>Medications</th><th>Notes</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
  </div>

  <div class="disclaimer">
    This report is for informational purposes only. Please consult your allergist or physician for medical advice.
    SmartAllergies does not provide medical diagnoses.
  </div>
</body>
</html>`;
}
