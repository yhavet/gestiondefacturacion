import html2pdf from 'html2pdf.js';
import { buildInvoiceHTML } from '../utils/pdfTemplate.js';

function downloadDocumentPDF(invoice, title, filenamePrefix) {
  const element = document.createElement('div');
  element.innerHTML = buildInvoiceHTML({ ...invoice, tipo: title });

  const nombre = invoice.cliente.nombre || 'Cliente';
  const apellido = invoice.cliente.apellido || '';

  return html2pdf()
    .set({
      margin: 10,
      filename: `${filenamePrefix}_${nombre}_${apellido}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
    })
    .from(element)
    .save();
}

export function downloadInvoicePDF(invoice) {
  return downloadDocumentPDF(invoice, 'COMPROBANTE', 'Comprobante');
}

export function downloadQuotePDF(quote) {
  return downloadDocumentPDF(
    { ...quote, vence: quote.vence },
    'PRESUPUESTO',
    'Presupuesto'
  );
}
