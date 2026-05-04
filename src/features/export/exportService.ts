import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { exportDataToPdfHtml } from './pdfTemplate';
import type { ExportSymptomLog, ExportSummary } from './pdfTemplate';
import type { AdvancedAllergyProfile } from '@/features/insights/types';

export async function generateAndSharePdf(
  logs: ExportSymptomLog[],
  summary: ExportSummary,
  allergyProfile?: AdvancedAllergyProfile | null,
): Promise<void> {
  const html = exportDataToPdfHtml(logs, summary, allergyProfile);
  const { uri: tmpUri } = await Print.printToFileAsync({ html });

  const date = new Date().toISOString().slice(0, 10);
  const namedUri = `${FileSystem.cacheDirectory}allergy-report-${date}.pdf`;
  await FileSystem.copyAsync({ from: tmpUri, to: namedUri });

  await Sharing.shareAsync(namedUri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Share your allergy report',
    UTI: 'com.adobe.pdf',
  });

  await FileSystem.deleteAsync(tmpUri, { idempotent: true });
}
