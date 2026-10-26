const app = {
    clients: [],
    products: [],
    editingId: null,

    init() {
        this.loadClients();
        this.renderClients();
    },

    loadClients() {
        const saved = localStorage.getItem('invoices');
        this.clients = saved ? JSON.parse(saved) : [];
    },

    saveClients() {
        localStorage.setItem('invoices', JSON.stringify(this.clients));
        this.renderClients();
    },

    addProduct() {
        this.products.push({
            id: Date.now(),
            producto: '',
            cantidad: 1,
            precioUnitario: 0,
            descuento: 0
        });
        this.renderProducts();
    },

    removeProduct(id) {
        this.products = this.products.filter(p => p.id !== id);
        this.renderProducts();
    },

    updateProduct(id, field, value) {
        const product = this.products.find(p => p.id === id);
        if (product) {
            product[field] = field === 'producto' ? value : parseFloat(value) || 0;
            this.renderProducts();
        }
    },

    renderProducts() {
        const container = document.getElementById('productsContainer');
        container.innerHTML = this.products.map(prod => {
            const total = this.calculateTotal(prod.cantidad, prod.precioUnitario, prod.descuento);
            return `
                <div class="table-row">
                    <input type="text" class="table-input" placeholder="Descripción"
                        value="${prod.producto}"
                        onchange="app.updateProduct(${prod.id}, 'producto', this.value)">
                    <input type="number" class="table-input" value="${prod.cantidad}"
                        onchange="app.updateProduct(${prod.id}, 'cantidad', this.value)">
                    <input type="number" class="table-input" value="${prod.precioUnitario}"
                        onchange="app.updateProduct(${prod.id}, 'precioUnitario', this.value)">
                    <input type="number" class="table-input" value="${prod.descuento}"
                        onchange="app.updateProduct(${prod.id}, 'descuento', this.value)">
                    <div class="table-cell">$ ${total.toFixed(2).replace('.', ',')}</div>
                    <button class="delete-btn" onclick="app.removeProduct(${prod.id})">×</button>
                </div>
            `;
        }).join('');
        this.updateTotal();
    },

    calculateTotal(cantidad, precio, descuento) {
        const subtotal = cantidad * precio;
        const descuentoAmount = subtotal * (descuento / 100);
        return subtotal - descuentoAmount;
    },

    updateTotal() {
        const total = this.products.reduce((sum, p) =>
            sum + this.calculateTotal(p.cantidad, p.precioUnitario, p.descuento), 0);
        document.getElementById('totalAmount').textContent = '$ ' + total.toFixed(2).replace('.', ',');
    },

    saveInvoice() {
        const nombre = document.getElementById('clientNombre').value.trim();
        const apellido = document.getElementById('clientApellido').value.trim();
        const documento = document.getElementById('clientDocumento').value.trim();
        const telefono = document.getElementById('clientTelefono').value.trim();
        const notes = document.getElementById('notes').value;
        const pagado = document.getElementById('pagado').checked;

        if (!nombre || !apellido || this.products.length === 0) {
            alert('Por favor completa los datos del cliente y agrega productos');
            return;
        }

        const total = this.products.reduce((sum, p) =>
            sum + this.calculateTotal(p.cantidad, p.precioUnitario, p.descuento), 0);

        const invoice = {
            id: this.editingId || Date.now(),
            cliente: { nombre, apellido, documento, telefono },
            productos: JSON.parse(JSON.stringify(this.products)),
            notas: notes,
            pagado: pagado,
            fecha: new Date().toLocaleString('es-ES'),
            total
        };

        if (this.editingId) {
            this.clients = this.clients.map(c => c.id === this.editingId ? invoice : c);
            this.editingId = null;
        } else {
            this.clients.push(invoice);
        }

        this.saveClients();
        this.resetForm();
        alert('Factura guardada exitosamente');
    },

    resetForm() {
        document.getElementById('clientNombre').value = '';
        document.getElementById('clientApellido').value = '';
        document.getElementById('clientDocumento').value = '';
        document.getElementById('clientTelefono').value = '';
        document.getElementById('notes').value = '';
        document.getElementById('pagado').checked = false;
        document.getElementById('searchInput').value = '';
        this.products = [];
        this.editingId = null;
        document.getElementById('cancelBtn').classList.add('hidden');
        document.getElementById('saveButtonText').textContent = 'Guardar';
        this.renderProducts();
    },

    editInvoice(invoice) {
        document.getElementById('clientNombre').value = invoice.cliente.nombre;
        document.getElementById('clientApellido').value = invoice.cliente.apellido;
        document.getElementById('clientDocumento').value = invoice.cliente.documento || '';
        document.getElementById('clientTelefono').value = invoice.cliente.telefono || '';
        document.getElementById('notes').value = invoice.notas;
        document.getElementById('pagado').checked = invoice.pagado || false;
        this.products = JSON.parse(JSON.stringify(invoice.productos));
        this.editingId = invoice.id;
        document.getElementById('cancelBtn').classList.remove('hidden');
        document.getElementById('saveButtonText').textContent = 'Actualizar';
        this.renderProducts();
        window.scrollTo(0, 0);
    },

    deleteInvoice(id) {
        if (confirm('¿Estás seguro de que quieres eliminar esta factura?')) {
            this.clients = this.clients.filter(c => c.id !== id);
            this.saveClients();
        }
    },

    _buildPDFTemplate(cliente, productos, notas, fecha, total, pagado) {
        const productsRows = productos.map((prod, idx) => {
            const rowTotal = this.calculateTotal(prod.cantidad, prod.precioUnitario, prod.descuento);
            const bgColor = idx % 2 === 0 ? '#f8f9fa' : '#ffffff';
            return `
                <tr style="background-color: ${bgColor}; border-bottom: 1px solid #e9ecef;">
                    <td style="padding: 14px 12px; font-size: 14px; color: #333;">${prod.producto || 'Producto'}</td>
                    <td style="padding: 14px 12px; text-align: center; font-size: 14px; color: #333;">${prod.cantidad}</td>
                    <td style="padding: 14px 12px; text-align: right; font-size: 14px; color: #333;">$${prod.precioUnitario.toFixed(2)}</td>
                    <td style="padding: 14px 12px; text-align: center; font-size: 14px; color: #666;">${prod.descuento}%</td>
                    <td style="padding: 14px 12px; text-align: right; font-size: 14px; color: #333; font-weight: 600;">$${rowTotal.toFixed(2)}</td>
                </tr>
            `;
        }).join('');

        const estadoHTML = pagado
            ? `<div style="background-color: #4caf50; color: white; padding: 12px 20px; border-radius: 6px; text-align: center;">
                   <p style="margin: 0 0 3px 0; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.9;">Estado</p>
                   <p style="margin: 0; font-size: 16px; font-weight: bold;">✓ Pagado</p>
               </div>`
            : `<div style="background-color: #ffb74d; color: white; padding: 10px 16px; border-radius: 6px; text-align: center;">
                   <p style="margin: 0 0 3px 0; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.9;">Estado</p>
                   <p style="margin: 0; font-size: 13px; font-weight: bold;">Pendiente</p>
               </div>
               <div style="background-color: #2c3e50; color: white; padding: 10px 18px; border-radius: 6px; text-align: right;">
                   <p style="margin: 0 0 4px 0; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.9;">Total a pagar</p>
                   <p style="margin: 0; font-size: 20px; font-weight: bold;">$${total.toFixed(2)}</p>
               </div>`;

        const documentoHTML = cliente.documento
            ? `<div>
                   <p style="margin: 0 0 8px 0; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">Documento</p>
                   <p style="margin: 0; font-size: 16px; color: #333;">${cliente.documento}</p>
               </div>` : '';

        const telefonoHTML = cliente.telefono
            ? `<div>
                   <p style="margin: 0 0 8px 0; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">Teléfono</p>
                   <p style="margin: 0; font-size: 16px; color: #333;">${cliente.telefono}</p>
               </div>` : '';

        const notasHTML = notas
            ? `<div style="background-color: #f8f9fa; border-left: 4px solid #2c3e50; padding: 16px; margin-top: 30px; border-radius: 4px;">
                   <p style="margin: 0 0 8px 0; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">Notas</p>
                   <p style="margin: 0; font-size: 13px; color: #333; line-height: 1.6;">${notas}</p>
               </div>` : '';

        return `
            <div style="padding: 40px; font-family: 'Arial', sans-serif; background-color: #fff; color: #333;">
                <div style="border-bottom: 3px solid #2c3e50; padding-bottom: 20px; margin-bottom: 30px;">
                    <h1 style="margin: 0; font-size: 42px; color: #2c3e50; font-weight: bold; letter-spacing: 2px;">COMPROBANTE</h1>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
                    <div>
                        <p style="margin: 0 0 8px 0; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">Fecha</p>
                        <p style="margin: 0; font-size: 16px; color: #333;">${fecha}</p>
                    </div>
                    <div>
                        <p style="margin: 0 0 8px 0; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">Cliente</p>
                        <p style="margin: 0; font-size: 16px; color: #333; font-weight: 600;">${cliente.nombre} ${cliente.apellido}</p>
                    </div>
                    ${documentoHTML}
                    ${telefonoHTML}
                </div>

                <table style="width: 100%; border-collapse: collapse; margin: 30px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <thead>
                        <tr style="background-color: #2c3e50; color: white;">
                            <th style="padding: 16px 12px; text-align: left; font-weight: 600; font-size: 13px; letter-spacing: 0.5px;">PRODUCTO</th>
                            <th style="padding: 16px 12px; text-align: center; font-weight: 600; font-size: 13px; letter-spacing: 0.5px;">CANT.</th>
                            <th style="padding: 16px 12px; text-align: right; font-weight: 600; font-size: 13px; letter-spacing: 0.5px;">PRECIO</th>
                            <th style="padding: 16px 12px; text-align: center; font-weight: 600; font-size: 13px; letter-spacing: 0.5px;">DESC. %</th>
                            <th style="padding: 16px 12px; text-align: right; font-weight: 600; font-size: 13px; letter-spacing: 0.5px;">TOTAL</th>
                        </tr>
                    </thead>
                    <tbody>${productsRows}</tbody>
                </table>

                <div style="display: flex; justify-content: space-between; align-items: center; margin: 30px 0;">
                    ${estadoHTML}
                </div>

                ${notasHTML}

                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e9ecef;">
                    <div style="text-align: center; font-size: 12px; color: #999; margin-bottom: 15px;">
                        <p style="margin: 0;">Generado el ${new Date().toLocaleString('es-ES')}</p>
                    </div>
                    <div style="background-color: #f0f0f0; padding: 12px; border-radius: 4px; text-align: center; border: 1px solid #d0d0d0;">
                        <p style="margin: 0; font-size: 11px; color: #666; font-weight: bold; letter-spacing: 0.5px;">
                            ✓ Certificado por <span style="color: #2c3e50; font-weight: bold;">TechSupport</span>
                        </p>
                    </div>
                </div>
            </div>
        `;
    },

    generatePDF() {
        const nombre = document.getElementById('clientNombre').value || 'Cliente';
        const apellido = document.getElementById('clientApellido').value || '';
        const documento = document.getElementById('clientDocumento').value || '';
        const telefono = document.getElementById('clientTelefono').value || '';
        const notes = document.getElementById('notes').value;
        const pagado = document.getElementById('pagado').checked;
        const total = this.products.reduce((sum, p) =>
            sum + this.calculateTotal(p.cantidad, p.precioUnitario, p.descuento), 0);
        const fecha = new Date().toLocaleString('es-ES');

        const element = document.createElement('div');
        element.innerHTML = this._buildPDFTemplate(
            { nombre, apellido, documento, telefono },
            this.products,
            notes,
            fecha,
            total,
            pagado
        );

        html2pdf().set({
            margin: 10,
            filename: `Comprobante_${nombre}_${apellido}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
        }).from(element).save();
    },

    renderClients() {
        const container = document.getElementById('clientsList');
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();

        const filtered = this.clients.filter(c =>
            c.cliente.nombre.toLowerCase().includes(searchTerm) ||
            c.cliente.apellido.toLowerCase().includes(searchTerm)
        );

        if (filtered.length === 0) {
            container.innerHTML = '<div class="empty-state">No hay registros</div>';
            return;
        }

        container.innerHTML = filtered.map(invoice => `
            <div class="client-card">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                        <h4 class="client-name">${invoice.cliente.nombre} ${invoice.cliente.apellido}</h4>
                        <p class="client-date">${invoice.fecha}</p>
                        <p class="client-info">${invoice.productos.length} productos — Total $ ${invoice.total.toFixed(2).replace('.', ',')}</p>
                    </div>
                    ${invoice.pagado
                        ? `<span style="background-color: #4caf50; color: white; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; white-space: nowrap; margin-left: 10px;">✓ Pagado</span>`
                        : `<span style="background-color: #ffb74d; color: white; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; white-space: nowrap; margin-left: 10px;">Pendiente</span>`
                    }
                </div>
                <div class="card-actions">
                    <button class="action-btn" onclick="app.generatePDFFromInvoice(${invoice.id})">PDF</button>
                    <button class="action-btn" onclick="app.editInvoice(app.clients.find(c => c.id === ${invoice.id}))">Editar</button>
                    <button class="delete-action-btn" onclick="app.deleteInvoice(${invoice.id})">Eliminar</button>
                </div>
            </div>
        `).join('');
    },

    filterClients() {
        this.renderClients();
    },

    generatePDFFromInvoice(id) {
        const invoice = this.clients.find(c => c.id === id);
        if (!invoice) return;

        const element = document.createElement('div');
        element.innerHTML = this._buildPDFTemplate(
            invoice.cliente,
            invoice.productos,
            invoice.notas,
            invoice.fecha,
            invoice.total,
            invoice.pagado
        );

        html2pdf().set({
            margin: 10,
            filename: `Comprobante_${invoice.cliente.nombre}_${invoice.cliente.apellido}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
        }).from(element).save();
    }
};

app.init();
