function Field({ id, label, type = 'text', placeholder, value, onChange }) {
  return (
    <div className="input-wrapper">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export default function ClientForm({ client, onChange }) {
  return (
    <>
      <div className="input-group">
        <Field id="clientNombre" label="Nombre" placeholder="Ej. Ana"
          value={client.nombre} onChange={(v) => onChange('nombre', v)} />
        <Field id="clientApellido" label="Apellido" placeholder="Ej. Pérez"
          value={client.apellido} onChange={(v) => onChange('apellido', v)} />
      </div>
      <div className="input-group">
        <Field id="clientDocumento" label="Número de Documento" placeholder="Ej. 12345678"
          value={client.documento} onChange={(v) => onChange('documento', v)} />
        <Field id="clientTelefono" label="Número de Teléfono" type="tel" placeholder="Ej. +54 9 11 2345-6789"
          value={client.telefono} onChange={(v) => onChange('telefono', v)} />
      </div>
      <div className="input-group single-field">
        <Field id="clientEmail" label="Correo electrónico" type="email" placeholder="Ej. ana@email.com"
          value={client.email} onChange={(v) => onChange('email', v)} />
      </div>
    </>
  );
}
