import { useEffect, useState } from 'react';

// Misma clave que la versión original, para no perder los datos guardados.
const STORAGE_KEY = 'invoices';

function loadInvoices() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function useInvoices() {
  const [invoices, setInvoices] = useState(loadInvoices);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
  }, [invoices]);

  return [invoices, setInvoices];
}
