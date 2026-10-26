import html2pdf from 'html2pdf.js';
import { buildInvoiceHTML } from '../utils/pdfTemplate.js';

export function downloadInvoicePDF(invoice) {
  const element = document.createElement('div');
  element.innerHTML = buildInvoiceHTML(invoice);

  const nombre = invoice.cliente.nombre || 'Cliente';
  const apellido = invoice.cliente.apellido || '';

  return html2pdf()
    .set({
      margin: 10,
      filename: `Comprobante_${nombre}_${apellido}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
    })
    .from(element)
    .save();
}
