import type { PollenLevel } from '@/features/pollen/types';
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
  pollenLevel?: PollenLevel;
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

const LEVEL_LABEL: Record<PollenLevel, string> = {
  none: 'None',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  very_high: 'Very High',
};

function symptomLabel(s: SymptomType): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function exportDataToPdfHtml(logs: ExportSymptomLog[], summary: ExportSummary): string {
  const worstDaysHtml = summary.worstDays
    .map(
      (d) =>
        `<li>${formatDate(d.date + 'T00:00:00')} — severity ${d.maxSeverity}/10</li>`,
    )
    .join('');

  const topSymptomsHtml = summary.mostCommonSymptoms
    .map((s) => `<span class="tag">${symptomLabel(s)}</span>`)
    .join(' ');

  const rowsHtml = logs
    .map(
      (log) => `
      <tr>
        <td>${formatDate(log.loggedAt)}</td>
        <td>${formatTime(log.loggedAt)}</td>
        <td>${log.symptoms.map(symptomLabel).join(', ')}</td>
        <td class="severity-${log.severity <= 3 ? 'low' : log.severity <= 6 ? 'med' : 'high'}">${log.severity}/10</td>
        <td>${log.pollenLevel ? LEVEL_LABEL[log.pollenLevel] : '—'}</td>
        <td>${log.medications ?? '—'}</td>
        <td>${log.notes ?? '—'}</td>
      </tr>`,
    )
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
    td { padding: 7px 10px; border-bottom: 1px solid #f3f4f6; vertical-align: top; }
    tr:nth-child(even) td { background: #fafafa; }
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

  ${
    summary.worstDays.length > 0
      ? `<div class="section">
    <div class="section-title">Worst Days</div>
    <ul>${worstDaysHtml}</ul>
  </div>`
      : ''
  }

  ${
    summary.mostCommonSymptoms.length > 0
      ? `<div class="section">
    <div class="section-title">Most Common Symptoms</div>
    <div style="margin-top:4px">${topSymptomsHtml}</div>
  </div>`
      : ''
  }

  <div class="section">
    <div class="section-title">Symptom Log</div>
    <table>
      <thead>
        <tr>
          <th>Date</th><th>Time</th><th>Symptoms</th><th>Severity</th>
          <th>Pollen</th><th>Medications</th><th>Notes</th>
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
