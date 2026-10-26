import { calculateLineTotal, formatMoney } from '../utils/helpers.js';

export default function ProductsTable({ products, onAdd, onUpdate, onRemove }) {
  return (
    <>
      <button className="add-button" onClick={onAdd}>+ Agregar producto</button>

      <div className="products-table">
        <div className="table-header">
          <div>Producto</div>
          <div>Cant.</div>
          <div>Precio unit.</div>
          <div>Desc. %</div>
          <div>Total</div>
          <div></div>
        </div>

        {products.map((p) => (
          <div className="table-row" key={p.id}>
            <input type="text" className="table-input" placeholder="Descripción"
              value={p.producto} onChange={(e) => onUpdate(p.id, 'producto', e.target.value)} />
            <input type="number" className="table-input" placeholder="Cantidad" aria-label="Cantidad"
              value={p.cantidad} onChange={(e) => onUpdate(p.id, 'cantidad', e.target.value)} />
            <input type="number" className="table-input" placeholder="Precio unitario" aria-label="Precio unitario"
              value={p.precioUnitario} onChange={(e) => onUpdate(p.id, 'precioUnitario', e.target.value)} />
            <input type="number" className="table-input" placeholder="Descuento (%)" aria-label="Descuento (%)"
              value={p.descuento} onChange={(e) => onUpdate(p.id, 'descuento', e.target.value)} />
            <div className="table-cell" aria-label="Total del producto">{formatMoney(calculateLineTotal(p))}</div>
            <button className="delete-btn" aria-label="Eliminar producto" onClick={() => onRemove(p.id)}>×</button>
          </div>
        ))}
      </div>
    </>
  );
}
