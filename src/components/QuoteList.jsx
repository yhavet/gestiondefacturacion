import { formatMoney } from '../utils/helpers.js';

export default function QuoteList({
  quotes,
  onEdit,
  onDelete,
  onPDF,
  onWhatsApp,
  onEmail,
  onAccept,
  onConvert,
}) {
  if (quotes.length === 0) {
    return <div className="empty-state">No hay presupuestos guardados</div>;
  }

  return (
    <div className="clients-list">
      {quotes.map((quote) => (
        <div className="client-card" key={quote.id}>
          <div className="card-top">
            <div className="card-main">
              <h4 className="client-name">{quote.cliente.nombre} {quote.cliente.apellido}</h4>
              <p className="client-date">Creado: {quote.fecha}</p>
              <p className="client-date">Válido hasta: {quote.vence}</p>
              <p className="client-info">
                {quote.productos.length} productos — Total {formatMoney(quote.total)}
              </p>
            </div>
            <span className={`badge quote-badge quote-badge-${quote.estado}`}>
              {quote.estado === 'aceptado'
                ? 'Aceptado'
                : quote.estado === 'convertido'
                  ? 'Convertido'
                  : 'Pendiente'}
            </span>
          </div>
          <div className="quote-actions">
            <button className="action-btn" onClick={() => onPDF(quote)}>PDF</button>
            <button className="action-btn" onClick={() => onWhatsApp(quote)}>WhatsApp</button>
            <button className="action-btn" onClick={() => onEmail(quote)}>Email</button>
            {quote.estado === 'pendiente' && (
              <>
                <button className="action-btn" onClick={() => onAccept(quote.id)}>Marcar aceptado</button>
                <button className="action-btn" onClick={() => onEdit(quote)}>Editar</button>
              </>
            )}
            {quote.estado === 'aceptado' && (
              <button className="action-btn" onClick={() => onConvert(quote)}>Convertir a factura</button>
            )}
            <button className="delete-action-btn" onClick={() => onDelete(quote.id)}>Eliminar</button>
          </div>
          <p className="share-hint">Se descarga el PDF para adjuntarlo antes de enviar.</p>
        </div>
      ))}
    </div>
  );
}
