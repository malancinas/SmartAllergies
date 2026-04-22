import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { exportDataToPdfHtml } from './pdfTemplate';
import type { ExportSymptomLog, ExportSummary } from './pdfTemplate';

export async function generateAndSharePdf(
  logs: ExportSymptomLog[],
  summary: ExportSummary,
): Promise<void> {
  const html = exportDataToPdfHtml(logs, summary);
  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Share your allergy report',
    UTI: 'com.adobe.pdf',
  });
}
