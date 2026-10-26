import { formatMoney } from '../utils/helpers.js';

export default function InvoiceList({ invoices, onEdit, onDelete, onPDF }) {
  if (invoices.length === 0) {
    return <div className="empty-state">No hay registros</div>;
  }

  return (
    <div className="clients-list">
      {invoices.map((inv) => (
        <div className="client-card" key={inv.id}>
          <div className="card-top">
            <div className="card-main">
              <h4 className="client-name">{inv.cliente.nombre} {inv.cliente.apellido}</h4>
              <p className="client-date">{inv.fecha}</p>
              <p className="client-info">
                {inv.productos.length} productos — Total {formatMoney(inv.total)}
              </p>
            </div>
            <span className={`badge ${inv.pagado ? 'badge-paid' : 'badge-pending'}`}>
              {inv.pagado ? '✓ Pagado' : 'Pendiente'}
            </span>
          </div>
          <div className="card-actions">
            <button className="action-btn" onClick={() => onPDF(inv)}>PDF</button>
            <button className="action-btn" onClick={() => onEdit(inv)}>Editar</button>
            <button className="delete-action-btn" onClick={() => onDelete(inv.id)}>Eliminar</button>
          </div>
        </div>
      ))}
    </div>
  );
}
