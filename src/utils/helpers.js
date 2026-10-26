export const toNumber = (value) => parseFloat(value) || 0;

export function calculateLineTotal(product) {
  const subtotal = toNumber(product.cantidad) * toNumber(product.precioUnitario);
  return subtotal - subtotal * (toNumber(product.descuento) / 100);
}

export function calculateTotal(products) {
  return products.reduce((sum, p) => sum + calculateLineTotal(p), 0);
}

export function formatMoney(value) {
  return '$ ' + toNumber(value).toFixed(2).replace('.', ',');
}

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[c]);
}

export const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const nowString = () => new Date().toLocaleString('es-ES');
