import { calculateLineTotal, escapeHtml, nowString, toNumber } from './helpers.js';

const labelStyle = 'margin: 0 0 8px 0; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;';
const valueStyle = 'margin: 0; font-size: 16px; color: #333;';
const headers = [
  ['PRODUCTO', 'left'],
  ['CANT.', 'center'],
  ['PRECIO', 'right'],
  ['DESC. %', 'center'],
  ['TOTAL', 'right'],
];

function field(label, value, bold = false) {
  if (!value) return '';
  return `<div>
      <p style="${labelStyle}">${label}</p>
      <p style="${valueStyle}${bold ? ' font-weight: 600;' : ''}">${escapeHtml(value)}</p>
    </div>`;
}

export function buildInvoiceHTML({
  cliente,
  productos,
  notas,
  fecha,
  total,
  pagado,
  tipo = 'COMPROBANTE',
  vence,
}) {
  const rows = productos.map((p, i) => {
    const bg = i % 2 === 0 ? '#f8f9fa' : '#ffffff';
    return `<tr style="background-color: ${bg}; border-bottom: 1px solid #e9ecef;">
        <td style="padding: 14px 12px; font-size: 14px; color: #333;">${escapeHtml(p.producto || 'Producto')}</td>
        <td style="padding: 14px 12px; text-align: center; font-size: 14px; color: #333;">${escapeHtml(p.cantidad)}</td>
        <td style="padding: 14px 12px; text-align: right; font-size: 14px; color: #333;">$${toNumber(p.precioUnitario).toFixed(2)}</td>
        <td style="padding: 14px 12px; text-align: center; font-size: 14px; color: #666;">${escapeHtml(p.descuento)}%</td>
        <td style="padding: 14px 12px; text-align: right; font-size: 14px; color: #333; font-weight: 600;">$${calculateLineTotal(p).toFixed(2)}</td>
      </tr>`;
  }).join('');

  const estado = vence
    ? `<div style="background-color: #e8f0fe; color: #2c3e50; padding: 12px 20px; border-radius: 6px; text-align: center;">
         <p style="margin: 0 0 3px 0; font-size: 10px; text-transform: uppercase; letter-spacing: 1px;">Vigencia</p>
         <p style="margin: 0; font-size: 14px; font-weight: bold;">Válido hasta ${escapeHtml(vence)}</p>
       </div>`
    : pagado
    ? `<div style="background-color: #4caf50; color: white; padding: 12px 20px; border-radius: 6px; text-align: center;">
         <p style="margin: 0 0 3px 0; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.9;">Estado</p>
         <p style="margin: 0; font-size: 16px; font-weight: bold;">✓ Pagado</p>
       </div>`
    : `<div style="background-color: #ffb74d; color: white; padding: 10px 16px; border-radius: 6px; text-align: center;">
         <p style="margin: 0 0 3px 0; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.9;">Estado</p>
         <p style="margin: 0; font-size: 13px; font-weight: bold;">Pendiente</p>
       </div>`;

  const totalBox = `<div style="background-color: #2c3e50; color: white; padding: 10px 18px; border-radius: 6px; text-align: right;">
       <p style="margin: 0 0 4px 0; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.9;">${vence ? 'Total presupuestado' : 'Total a pagar'}</p>
       <p style="margin: 0; font-size: 20px; font-weight: bold;">$${total.toFixed(2)}</p>
     </div>`;

  const notasHTML = notas
    ? `<div style="background-color: #f8f9fa; border-left: 4px solid #2c3e50; padding: 16px; margin-top: 30px; border-radius: 4px;">
         <p style="${labelStyle}">Notas</p>
         <p style="margin: 0; font-size: 13px; color: #333; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(notas)}</p>
       </div>`
    : '';

  return `
    <div style="padding: 40px; font-family: Arial, sans-serif; background-color: #fff; color: #333;">
      <div style="border-bottom: 3px solid #2c3e50; padding-bottom: 20px; margin-bottom: 30px;">
        <h1 style="margin: 0; font-size: 42px; color: #2c3e50; font-weight: bold; letter-spacing: 2px;">${escapeHtml(tipo)}</h1>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
        ${field('Fecha', fecha)}
        ${field('Cliente', `${cliente.nombre} ${cliente.apellido}`.trim(), true)}
        ${field('Documento', cliente.documento)}
        ${field('Teléfono', cliente.telefono)}
        ${field('Correo electrónico', cliente.email)}
      </div>

      <table style="width: 100%; border-collapse: collapse; margin: 30px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <thead>
          <tr style="background-color: #2c3e50; color: white;">
            ${headers.map(([h, align]) => `<th style="padding: 16px 12px; text-align: ${align}; font-weight: 600; font-size: 13px; letter-spacing: 0.5px;">${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; margin: 30px 0;">
        ${estado}
        ${totalBox}
      </div>

      ${notasHTML}

      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e9ecef;">
        <p style="margin: 0 0 15px 0; text-align: center; font-size: 12px; color: #999;">Generado el ${nowString()}</p>
        ${vence ? '' : `<div style="background-color: #f0f0f0; padding: 12px; border-radius: 4px; text-align: center; border: 1px solid #d0d0d0;">
          <p style="margin: 0; font-size: 11px; color: #666; font-weight: bold; letter-spacing: 0.5px;">
            ✓ Certificado por <span style="color: #2c3e50; font-weight: bold;">TechSupport</span>
          </p>
        </div>`}
      </div>
    </div>`;
}
