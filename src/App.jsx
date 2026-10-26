import { useMemo, useState } from 'react';
import ClientForm from './components/ClientForm.jsx';
import ProductsTable from './components/ProductsTable.jsx';
import InvoiceList from './components/InvoiceList.jsx';
import { useInvoices } from './hooks/useInvoices.js';
import { downloadInvoicePDF } from './services/pdf.js';
import { calculateTotal, formatMoney, newId, nowString, toNumber } from './utils/helpers.js';

const EMPTY_CLIENT = { nombre: '', apellido: '', documento: '', telefono: '' };

export default function App() {
  const [invoices, setInvoices] = useInvoices();
  const [client, setClient] = useState(EMPTY_CLIENT);
  const [products, setProducts] = useState([]);
  const [notas, setNotas] = useState('');
  const [pagado, setPagado] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');

  const total = useMemo(() => calculateTotal(products), [products]);

  const filteredInvoices = useMemo(() => {
    const term = search.trim().toLowerCase();
    return invoices.filter(
      (i) =>
        i.cliente.nombre.toLowerCase().includes(term) ||
        i.cliente.apellido.toLowerCase().includes(term)
    );
  }, [invoices, search]);

  // Productos
  const addProduct = () =>
    setProducts((ps) => [...ps, { id: newId(), producto: '', cantidad: 1, precioUnitario: 0, descuento: 0 }]);

  const updateProduct = (id, field, value) =>
    setProducts((ps) => ps.map((p) => (p.id === id ? { ...p, [field]: value } : p)));

  const removeProduct = (id) => setProducts((ps) => ps.filter((p) => p.id !== id));

  // Cliente
  const updateClient = (field, value) => setClient((c) => ({ ...c, [field]: value }));

  // Formulario
  const resetForm = () => {
    setClient(EMPTY_CLIENT);
    setProducts([]);
    setNotas('');
    setPagado(false);
    setEditing(null);
    setSearch('');
  };

  const saveInvoice = () => {
    const nombre = client.nombre.trim();
    const apellido = client.apellido.trim();

    if (!nombre || !apellido || products.length === 0) {
      alert('Por favor completa los datos del cliente y agrega productos');
      return;
    }

    const invoice = {
      id: editing ? editing.id : newId(),
      cliente: {
        nombre,
        apellido,
        documento: client.documento.trim(),
        telefono: client.telefono.trim(),
      },
      productos: products.map((p) => ({
        ...p,
        cantidad: toNumber(p.cantidad),
        precioUnitario: toNumber(p.precioUnitario),
        descuento: toNumber(p.descuento),
      })),
      notas,
      pagado,
      fecha: editing ? editing.fecha : nowString(),
      total,
    };

    setInvoices((list) =>
      editing ? list.map((i) => (i.id === editing.id ? invoice : i)) : [...list, invoice]
    );
    resetForm();
    alert('Factura guardada exitosamente');
  };

  const editInvoice = (invoice) => {
    setClient({
      nombre: invoice.cliente.nombre,
      apellido: invoice.cliente.apellido,
      documento: invoice.cliente.documento || '',
      telefono: invoice.cliente.telefono || '',
    });
    setProducts(invoice.productos.map((p) => ({ ...p })));
    setNotas(invoice.notas || '');
    setPagado(!!invoice.pagado);
    setEditing(invoice);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteInvoice = (id) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta factura?')) return;
    setInvoices((list) => list.filter((i) => i.id !== id));
    if (editing?.id === id) resetForm();
  };

  const pdfFromForm = () =>
    downloadInvoicePDF({
      cliente: { ...client },
      productos: products,
      notas,
      fecha: editing ? editing.fecha : nowString(),
      total,
      pagado,
    });

  return (
    <>
      <div className="header">
        <h1>Gestor de Facturas</h1>
      </div>

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
              onChange={(e) => setNotas(e.target.value)}
            />
          </div>

          <div className="checkbox-row">
            <input
              type="checkbox"
              id="pagado"
              checked={pagado}
              onChange={(e) => setPagado(e.target.checked)}
            />
            <label htmlFor="pagado">Marcar como pagado</label>
          </div>

          <div className="total-section">
            <div className="price-total">Precio total final</div>
            <div className="total-amount">{formatMoney(total)}</div>
            <div className="button-group">
              <button className="save-button" onClick={saveInvoice}>
                {editing ? 'Actualizar' : 'Guardar'}
              </button>
              <button className="pdf-button" onClick={pdfFromForm}>PDF</button>
              {editing && (
                <button className="cancel-button" onClick={resetForm}>Cancelar</button>
              )}
            </div>
            <button className="clean-button" onClick={resetForm}>Limpiar</button>
          </div>
        </div>

        <div className="history-section">
          <h2 className="section-title">Registros guardados</h2>
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por nombre o apellido"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <InvoiceList
            invoices={filteredInvoices}
            onEdit={editInvoice}
            onDelete={deleteInvoice}
            onPDF={downloadInvoicePDF}
          />
        </div>
      </div>
    </>
  );
}
