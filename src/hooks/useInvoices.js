import { useEffect, useState } from 'react';

export function useStoredList(storageKey) {
  const [items, setItems] = useState(() => {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
      throw new TypeError(`Stored value for "${storageKey}" must be an array`);
    } catch (error) {
      console.error(`Could not load "${storageKey}" from localStorage.`, error);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, storageKey]);

  return [items, setItems];
}

export function useInvoices() {
  return useStoredList('invoices');
}

export function useQuotes() {
  return useStoredList('quotes');
}
