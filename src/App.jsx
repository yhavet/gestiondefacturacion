import { useMemo, useState } from 'react';
import ClientForm from './components/ClientForm.jsx';
import InvoiceList from './components/InvoiceList.jsx';
import ProductsTable from './components/ProductsTable.jsx';
import QuoteList from './components/QuoteList.jsx';
import { useInvoices, useQuotes } from './hooks/useInvoices.js';
import { downloadInvoicePDF, downloadQuotePDF } from './services/pdf.js';
import { calculateTotal, formatMoney, newId, nowString, toNumber } from './utils/helpers.js';

const EMPTY_CLIENT = { nombre: '', apellido: '', documento: '', telefono: '', email: '' };
const QUOTE_VALIDITY_DAYS = 15;

function getQuoteExpiryDate() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + QUOTE_VALIDITY_DAYS);
  return date.toLocaleDateString('es-AR');
}

function buildQuoteMessage(quote) {
  const lines = quote.productos.map(
    (product) => `• ${product.producto || 'Producto'} x ${product.cantidad}: ${formatMoney(
      toNumber(product.cantidad) * toNumber(product.precioUnitario) *
      (1 - toNumber(product.descuento) / 100)
    )}`
  );
  return [
    `Presupuesto para ${quote.cliente.nombre} ${quote.cliente.apellido}`,
    ...lines,
    `Total: ${formatMoney(quote.total)}`,
    `Válido hasta: ${quote.vence}`,
    quote.notas ? `Notas: ${quote.notas}` : '',
    '',
    'Adjunto el presupuesto en PDF.',
  ].filter(Boolean).join('\n');
}

function openQuoteComposer(quote, channel) {
  const message = buildQuoteMessage(quote);
  const target = channel === 'whatsapp'
    ? `https://wa.me/${(quote.cliente.telefono || '').replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
    : `mailto:${encodeURIComponent(quote.cliente.email || '')}?subject=${encodeURIComponent(
        `Presupuesto para ${quote.cliente.nombre} ${quote.cliente.apellido}`
      )}&body=${encodeURIComponent(message)}`;
  const link = document.createElement('a');
  link.href = target;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  link.remove();
  downloadQuotePDF(quote);
}

export default function App() {
  const [invoices, setInvoices] = useInvoices();
  const [quotes, setQuotes] = useQuotes();
  const [section, setSection] = useState('invoices');
  const [client, setClient] = useState(EMPTY_CLIENT);
  const [products, setProducts] = useState([]);
  const [notas, setNotas] = useState('');
  const [pagado, setPagado] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editingType, setEditingType] = useState(null);
  const [search, setSearch] = useState('');

  const total = useMemo(() => calculateTotal(products), [products]);

  const filteredInvoices = useMemo(() => {
    const term = search.trim().toLowerCase();
    return invoices.filter((invoice) =>
      invoice.cliente.nombre.toLowerCase().includes(term) ||
      invoice.cliente.apellido.toLowerCase().includes(term)
    );
  }, [invoices, search]);

  const filteredQuotes = useMemo(() => {
    const term = search.trim().toLowerCase();
    return quotes.filter((quote) =>
      quote.cliente.nombre.toLowerCase().includes(term) ||
      quote.cliente.apellido.toLowerCase().includes(term)
    );
  }, [quotes, search]);

  const addProduct = () =>
    setProducts((current) => [...current, {
      id: newId(),
      producto: '',
      cantidad: 1,
      precioUnitario: 0,
      descuento: 0,
    }]);

  const updateProduct = (id, field, value) =>
    setProducts((current) => current.map((product) =>
      product.id === id ? { ...product, [field]: value } : product
    ));

  const removeProduct = (id) =>
    setProducts((current) => current.filter((product) => product.id !== id));

  const updateClient = (field, value) =>
    setClient((current) => ({ ...current, [field]: value }));

  const resetForm = () => {
    setClient(EMPTY_CLIENT);
    setProducts([]);
    setNotas('');
    setPagado(false);
    setEditing(null);
    setEditingType(null);
    setSearch('');
  };

  const getValidatedFormData = () => {
    const nombre = client.nombre.trim();
    const apellido = client.apellido.trim();

    if (!nombre || !apellido || products.length === 0) {
      alert('Por favor completa los datos del cliente y agrega productos');
      return null;
    }

    const cliente = {
      nombre,
      apellido,
      documento: client.documento.trim(),
      telefono: client.telefono.trim(),
      email: client.email.trim(),
    };
    const productos = products.map((product) => ({
      ...product,
      cantidad: toNumber(product.cantidad),
      precioUnitario: toNumber(product.precioUnitario),
      descuento: toNumber(product.descuento),
    }));
    return { cliente, productos, notas, total };
  };

  const saveInvoice = () => {
    const formData = getValidatedFormData();
    if (!formData) return;

    const invoice = {
      ...formData,
      id: editingType === 'invoice' ? editing.id : newId(),
      pagado,
      fecha: editingType === 'invoice' ? editing.fecha : nowString(),
    };

    setInvoices((list) =>
      editingType === 'invoice'
        ? list.map((item) => (item.id === editing.id ? invoice : item))
        : [...list, invoice]
    );
    resetForm();
    alert('Factura guardada exitosamente');
  };

  const saveQuote = () => {
    const formData = getValidatedFormData();
    if (!formData) return;

    const quote = {
      ...formData,
      id: editingType === 'quote' ? editing.id : newId(),
      fecha: editingType === 'quote' ? editing.fecha : nowString(),
      vence: editingType === 'quote' ? editing.vence : getQuoteExpiryDate(),
      estado: editingType === 'quote' ? editing.estado : 'pendiente',
    };
    setQuotes((list) =>
      editingType === 'quote'
        ? list.map((item) => (item.id === editing.id ? quote : item))
        : [...list, quote]
    );
    resetForm();
    alert('Presupuesto guardado. Tiene una vigencia de 15 días.');
  };

  const editRecord = (record, type) => {
    setClient({
      nombre: record.cliente.nombre,
      apellido: record.cliente.apellido,
      documento: record.cliente.documento || '',
      telefono: record.cliente.telefono || '',
      email: record.cliente.email || '',
    });
    setProducts(record.productos.map((product) => ({ ...product })));
    setNotas(record.notas || '');
    setPagado(type === 'invoice' && !!record.pagado);
    setEditing(record);
    setEditingType(type);
    setSection(type === 'invoice' ? 'invoices' : 'quotes');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteInvoice = (id) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta factura?')) return;
    setInvoices((list) => list.filter((invoice) => invoice.id !== id));
    if (editingType === 'invoice' && editing?.id === id) resetForm();
  };

  const deleteQuote = (id) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este presupuesto?')) return;
    setQuotes((list) => list.filter((quote) => quote.id !== id));
    if (editingType === 'quote' && editing?.id === id) resetForm();
  };

  const markQuoteAccepted = (id) => {
    setQuotes((list) => list.map((quote) =>
      quote.id === id ? { ...quote, estado: 'aceptado' } : quote
    ));
  };

  const convertQuoteToInvoice = (quote) => {
    if (!confirm('¿Convertir este presupuesto aceptado en una factura?')) return;
    const invoice = {
      id: newId(),
      cliente: { ...quote.cliente },
      productos: quote.productos.map((product) => ({ ...product })),
      notas: quote.notas,
      pagado: false,
      fecha: nowString(),
      total: quote.total,
      presupuestoId: quote.id,
    };
    setInvoices((list) => [...list, invoice]);
    setQuotes((list) => list.map((item) =>
      item.id === quote.id
        ? { ...item, estado: 'convertido', facturaId: invoice.id }
        : item
    ));
    resetForm();
    setSection('invoices');
    alert('Presupuesto convertido en factura.');
  };

  const currentQuote = {
    cliente: { ...client },
    productos: products.map((product) => ({
      ...product,
      cantidad: toNumber(product.cantidad),
      precioUnitario: toNumber(product.precioUnitario),
      descuento: toNumber(product.descuento),
    })),
    notas,
    fecha: editingType === 'quote' ? editing.fecha : nowString(),
    vence: editingType === 'quote' ? editing.vence : getQuoteExpiryDate(),
    total,
  };

  const switchSection = (nextSection) => {
    if (editing) return;
    setSection(nextSection);
    setSearch('');
  };

  return (
    <>
      <div className="header">
        <img
          className="brand-logo"
          src="/tech-support-logo.png"
          alt="Tech Support"
          width="88"
          height="88"
        />
        <h1>Gestor de Facturas</h1>
      </div>

      <nav className="section-switch" aria-label="Tipo de documento">
        <button
          className={`section-tab ${section === 'invoices' ? 'active' : ''}`}
          aria-pressed={section === 'invoices'}
          disabled={!!editing}
          onClick={() => switchSection('invoices')}
        >
          Facturas
        </button>
        <button
          className={`section-tab ${section === 'quotes' ? 'active' : ''}`}
          aria-pressed={section === 'quotes'}
          disabled={!!editing}
          onClick={() => switchSection('quotes')}
        >
          Presupuestos
        </button>
      </nav>

      <div className="container">
        <div className="form-section">
          <h2 className="section-title">Cliente</h2>
          <ClientForm client={client} onChange={updateClient} />

          <h2 className="section-title">Productos</h2>
          <ProductsTable
            products={products}
            onAdd={addProduct}
            onUpdate={updateProduct}
            onRemove={removeProduct}
          />

          <div className="notes-section">
            <h3 className="notes-label">Notas (opcional)</h3>
            <textarea
              className="notes-input"
              placeholder="Observaciones, forma de pago, etc."
              value={notas}
              onChange={(event) => setNotas(event.target.value)}
            />
          </div>

          {section === 'invoices' ? (
            <div className="checkbox-row">
              <input
                type="checkbox"
                id="pagado"
                checked={pagado}
                onChange={(event) => setPagado(event.target.checked)}
              />
              <label htmlFor="pagado">Marcar como pagado</label>
            </div>
          ) : (
            <p className="quote-validity-note">El presupuesto tendrá una vigencia de 15 días.</p>
          )}

          <div className="total-section">
            <div className="price-total">
              {section === 'quotes' ? 'Total del presupuesto' : 'Precio total final'}
            </div>
            <div className="total-amount">{formatMoney(total)}</div>
            <div className="button-group">
              <button className="save-button" onClick={section === 'quotes' ? saveQuote : saveInvoice}>
                {editing ? 'Actualizar' : section === 'quotes' ? 'Guardar presupuesto' : 'Guardar factura'}
              </button>
              <button
                className="pdf-button"
                onClick={() => section === 'quotes' ? downloadQuotePDF(currentQuote) : downloadInvoicePDF({
                  ...currentQuote,
                  pagado,
                })}
              >
                PDF
              </button>
              {editing && (
                <button className="cancel-button" onClick={resetForm}>Cancelar</button>
              )}
            </div>
            <button className="clean-button" onClick={resetForm}>Limpiar</button>
          </div>
        </div>

        <div className="history-section">
          <h2 className="section-title">
            {section === 'quotes' ? 'Presupuestos guardados' : 'Registros guardados'}
          </h2>
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por nombre o apellido"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          {section === 'quotes' ? (
            <QuoteList
              quotes={filteredQuotes}
              onEdit={(quote) => editRecord(quote, 'quote')}
              onDelete={deleteQuote}
              onPDF={downloadQuotePDF}
              onWhatsApp={(quote) => openQuoteComposer(quote, 'whatsapp')}
              onEmail={(quote) => openQuoteComposer(quote, 'email')}
              onAccept={markQuoteAccepted}
              onConvert={convertQuoteToInvoice}
            />
          ) : (
            <InvoiceList
              invoices={filteredInvoices}
              onEdit={(invoice) => editRecord(invoice, 'invoice')}
              onDelete={deleteInvoice}
              onPDF={downloadInvoicePDF}
            />
          )}
        </div>
      </div>
    </>
  );
}
