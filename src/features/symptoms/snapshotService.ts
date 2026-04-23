import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { SymptomLog, SymptomType } from './types';

const SYMPTOM_LABEL: Record<SymptomType, string> = {
  sneezing: 'Sneezing',
  itchy_eyes: 'Itchy eyes',
  runny_nose: 'Runny nose',
  congestion: 'Congestion',
  skin_reaction: 'Skin reaction',
  headache: 'Headache',
};

const SYMPTOM_EMOJI: Record<SymptomType, string> = {
  sneezing: '🤧',
  itchy_eyes: '👁️',
  runny_nose: '💧',
  congestion: '😤',
  skin_reaction: '🔴',
  headache: '🤕',
};

function severityColor(s: number): string {
  if (s <= 3) return '#22c55e';
  if (s <= 6) return '#f59e0b';
  return '#ef4444';
}

function severityLabel(s: number): string {
  if (s <= 3) return 'Low';
  if (s <= 6) return 'Moderate';
  return 'High';
}

function buildSnapshotHtml(date: string, logs: SymptomLog[]): string {
  const maxSeverity = Math.max(...logs.map((l) => l.severity));
  const allSymptoms = Array.from(new Set(logs.flatMap((l) => l.symptoms)));
  const color = severityColor(maxSeverity);
  const label = severityLabel(maxSeverity);

  const displayDate = new Date(date).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const symptomRows = allSymptoms
    .map(
      (s) =>
        `<div class="symptom-row">
          <span class="emoji">${SYMPTOM_EMOJI[s as SymptomType] ?? ''}</span>
          <span class="symptom-label">${SYMPTOM_LABEL[s as SymptomType] ?? s}</span>
        </div>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, Helvetica, Arial, sans-serif;
    background: #f8fafc;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 24px;
  }
  .card {
    background: white;
    border-radius: 20px;
    padding: 32px;
    max-width: 400px;
    width: 100%;
    box-shadow: 0 4px 24px rgba(0,0,0,0.08);
  }
  .header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;
  }
  .app-name {
    font-size: 13px;
    font-weight: 600;
    color: #6366f1;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  .date {
    font-size: 14px;
    color: #94a3b8;
    margin-top: 2px;
  }
  .severity-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: ${color}1a;
    border-radius: 12px;
    padding: 10px 16px;
    margin-bottom: 20px;
  }
  .severity-number {
    font-size: 28px;
    font-weight: 800;
    color: ${color};
  }
  .severity-text {
    font-size: 14px;
    font-weight: 600;
    color: ${color};
  }
  .section-title {
    font-size: 11px;
    font-weight: 600;
    color: #94a3b8;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    margin-bottom: 12px;
  }
  .symptom-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 0;
    border-bottom: 1px solid #f1f5f9;
  }
  .symptom-row:last-child { border-bottom: none; }
  .emoji { font-size: 20px; }
  .symptom-label { font-size: 14px; color: #374151; }
  .footer {
    margin-top: 24px;
    font-size: 11px;
    color: #cbd5e1;
    text-align: center;
  }
</style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div>
        <div class="app-name">Local Allergies</div>
        <div class="date">${displayDate}</div>
      </div>
    </div>

    <div class="section-title">Peak severity</div>
    <div class="severity-badge">
      <span class="severity-number">${maxSeverity}</span>
      <span class="severity-text">${label}</span>
    </div>

    ${allSymptoms.length > 0 ? `
    <div class="section-title">Symptoms logged</div>
    ${symptomRows}
    ` : ''}

    <div class="footer">Tracked with Local Allergies</div>
  </div>
</body>
</html>`;
}

export async function shareSymptomSnapshot(date: string, logs: SymptomLog[]): Promise<void> {
  const html = buildSnapshotHtml(date, logs);
  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Share your allergy snapshot',
    UTI: 'com.adobe.pdf',
  });
}
