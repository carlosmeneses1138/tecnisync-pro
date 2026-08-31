// ============================================
// Módulo Técnico — TecniSync Pro
// ============================================

let perfilActual = null;
let listaClientes = [];
let listaServicios = [];

(async () => {
  perfilActual = await protegerPagina('tecnico');
  if (!perfilActual) return;
  document.getElementById('nombre-usuario').textContent = perfilActual.nombre;

  cargarClientes();
  cargarServiciosDisponibles();
  cargarOrdenes();
})();

document.querySelectorAll('.tab-modulo').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab-modulo').forEach(t => t.classList.remove('activo'));
    document.querySelectorAll('.vista').forEach(v => v.classList.remove('activa'));
    tab.classList.add('activo');
    document.getElementById('vista-' + tab.dataset.vista).classList.add('activa');
  });
});

function escaparHtml(texto) {
  const div = document.createElement('div');
  div.textContent = texto || '';
  return div.innerHTML;
}

// ============================================
// CLIENTES (mismo patrón que el módulo Vendedor)
// ============================================

async function cargarClientes() {
  const { data, error } = await supabaseClient.from('clientes').select('*').order('creado_en', { ascending: false });
  const cuerpo = document.getElementById('tabla-clientes-body');
  if (error) { cuerpo.innerHTML = `<tr><td colspan="5" class="celda-vacia">Error al cargar clientes.</td></tr>`; return; }
  listaClientes = data;
  dibujarClientes(listaClientes);
}

function dibujarClientes(clientes) {
  const cuerpo = document.getElementById('tabla-clientes-body');
  if (clientes.length === 0) {
    cuerpo.innerHTML = `<tr><td colspan="5" class="celda-vacia">Todavía no hay clientes registrados.</td></tr>`;
    return;
  }
  cuerpo.innerHTML = clientes.map(c => `
    <tr>
      <td>${escaparHtml(c.nombre)}</td>
      <td><span class="chip-tipo">${c.tipo || '—'}</span></td>
      <td>${escaparHtml(c.telefono || '—')}</td>
      <td>${escaparHtml(c.ciudad || '—')}</td>
      <td class="acciones-fila">
        <button class="btn-icono" onclick="editarCliente('${c.id}')">Editar</button>
        <button class="btn-icono peligro" onclick="borrarCliente('${c.id}')">Borrar</button>
      </td>
    </tr>
  `).join('');
}

document.getElementById('buscador-clientes').addEventListener('input', (e) => {
  const texto = e.target.value.toLowerCase();
  dibujarClientes(listaClientes.filter(c => c.nombre.toLowerCase().includes(texto)));
});

const modalCliente = document.getElementById('modal-cliente');
const formCliente = document.getElementById('form-cliente');

document.getElementById('btn-nuevo-cliente').addEventListener('click', () => {
  formCliente.reset();
  document.getElementById('cliente-id').value = '';
  document.getElementById('titulo-modal-cliente').textContent = 'Nuevo cliente';
  document.getElementById('mensaje-error-cliente').textContent = '';
  modalCliente.classList.add('activo');
});

document.getElementById('btn-cancelar-cliente').addEventListener('click', () => {
  modalCliente.classList.remove('activo');
});

function editarCliente(id) {
  const c = listaClientes.find(x => x.id === id);
  if (!c) return;
  document.getElementById('cliente-id').value = c.id;
  document.getElementById('cliente-nombre').value = c.nombre || '';
  document.getElementById('cliente-tipo').value = c.tipo || 'persona';
  document.getElementById('cliente-telefono').value = c.telefono || '';
  document.getElementById('cliente-email').value = c.email || '';
  document.getElementById('cliente-direccion').value = c.direccion || '';
  document.getElementById('cliente-ciudad').value = c.ciudad || '';
  document.getElementById('titulo-modal-cliente').textContent = 'Editar cliente';
  document.getElementById('mensaje-error-cliente').textContent = '';
  modalCliente.classList.add('activo');
}

async function borrarCliente(id) {
  if (!confirm('¿Seguro que quieres borrar este cliente?')) return;
  const { error } = await supabaseClient.from('clientes').delete().eq('id', id);
  if (error) { alert('No se pudo borrar el cliente.'); return; }
  cargarClientes();
}

formCliente.addEventListener('submit', async (e) => {
  e.preventDefault();
  const mensajeError = document.getElementById('mensaje-error-cliente');
  mensajeError.textContent = '';

  const id = document.getElementById('cliente-id').value;
  const datos = {
    nombre: document.getElementById('cliente-nombre').value.trim(),
    tipo: document.getElementById('cliente-tipo').value,
    telefono: document.getElementById('cliente-telefono').value.trim(),
    email: document.getElementById('cliente-email').value.trim(),
    direccion: document.getElementById('cliente-direccion').value.trim(),
    ciudad: document.getElementById('cliente-ciudad').value.trim(),
  };

  let error;
  if (id) {
    ({ error } = await supabaseClient.from('clientes').update(datos).eq('id', id));
  } else {
    datos.creado_por = perfilActual.id;
    ({ error } = await supabaseClient.from('clientes').insert(datos));
  }

  if (error) { mensajeError.textContent = 'No se pudo guardar.'; return; }
  modalCliente.classList.remove('activo');
  cargarClientes();
});

// ============================================
// ÓRDENES DE SERVICIO
// ============================================

let fotoArchivoOrden = null;
let coordenadasOrden = null;
let listaOrdenes = [];
const firmasEstadoOrden = {};

async function cargarServiciosDisponibles() {
  const { data, error } = await supabaseClient.from('servicios').select('*').order('nombre');
  if (!error) listaServicios = data;
}

document.getElementById('btn-nueva-orden').addEventListener('click', abrirFormularioOrden);
document.getElementById('btn-volver-listado-ordenes').addEventListener('click', () => {
  document.getElementById('ordenes-formulario').style.display = 'none';
  document.getElementById('ordenes-listado').style.display = 'block';
});

function abrirFormularioOrden() {
  fotoArchivoOrden = null;
  coordenadasOrden = null;
  document.getElementById('orden-cliente').value = '';
  document.getElementById('orden-servicio').value = '';
  document.getElementById('orden-notas').value = '';
  document.getElementById('orden-foto-input').value = '';
  document.getElementById('orden-foto-preview').style.display = 'none';
  document.getElementById('estado-gps-orden').textContent = 'Todavía no se ha capturado la ubicación.';
  document.getElementById('estado-gps-orden').classList.remove('ok');
  document.getElementById('mensaje-error-orden').textContent = '';

  document.getElementById('orden-cliente').innerHTML = '<option value="">Selecciona un cliente...</option>' +
    listaClientes.map(c => `<option value="${c.id}">${escaparHtml(c.nombre)}</option>`).join('');

  document.getElementById('orden-servicio').innerHTML = '<option value="">Selecciona un servicio...</option>' +
    listaServicios.map(s => `<option value="${s.id}">${escaparHtml(s.nombre)}</option>`).join('');

  inicializarFirmaOrden('firma-cliente-orden');
  inicializarFirmaOrden('firma-tecnico-orden');

  document.getElementById('ordenes-listado').style.display = 'none';
  document.getElementById('ordenes-formulario').style.display = 'block';
}

document.getElementById('orden-foto-input').addEventListener('change', (e) => {
  const archivo = e.target.files[0];
  if (!archivo) return;
  fotoArchivoOrden = archivo;
  const preview = document.getElementById('orden-foto-preview');
  preview.src = URL.createObjectURL(archivo);
  preview.style.display = 'block';
});

document.getElementById('btn-obtener-gps-orden').addEventListener('click', () => {
  const estado = document.getElementById('estado-gps-orden');
  estado.textContent = 'Buscando tu ubicación...';
  estado.classList.remove('ok');

  if (!navigator.geolocation) {
    estado.textContent = 'Tu navegador no soporta geolocalización.';
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (posicion) => {
      coordenadasOrden = { lat: posicion.coords.latitude, lng: posicion.coords.longitude };
      estado.textContent = `Ubicación capturada: ${coordenadasOrden.lat.toFixed(5)}, ${coordenadasOrden.lng.toFixed(5)}`;
      estado.classList.add('ok');
    },
    () => { estado.textContent = 'No se pudo obtener la ubicación. Revisa los permisos de GPS.'; },
    { enableHighAccuracy: true }
  );
});

function inicializarFirmaOrden(idCanvas) {
  const canvas = document.getElementById(idCanvas);
  const ratio = window.devicePixelRatio || 1;
  canvas.width = canvas.offsetWidth * ratio;
  canvas.height = canvas.offsetHeight * ratio;
  const ctx = canvas.getContext('2d');
  ctx.scale(ratio, ratio);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
  ctx.strokeStyle = '#171B26';
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';

  firmasEstadoOrden[idCanvas] = { dibujando: false, tieneTrazo: false, ctx };

  function posicion(e) {
    const rect = canvas.getBoundingClientRect();
    const punto = e.touches ? e.touches[0] : e;
    return { x: punto.clientX - rect.left, y: punto.clientY - rect.top };
  }
  function empezar(e) {
    e.preventDefault();
    firmasEstadoOrden[idCanvas].dibujando = true;
    firmasEstadoOrden[idCanvas].tieneTrazo = true;
    const p = posicion(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  }
  function mover(e) {
    if (!firmasEstadoOrden[idCanvas].dibujando) return;
    e.preventDefault();
    const p = posicion(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }
  function terminar() { firmasEstadoOrden[idCanvas].dibujando = false; }

  canvas.onmousedown = empezar;
  canvas.onmousemove = mover;
  canvas.onmouseup = terminar;
  canvas.onmouseleave = terminar;
  canvas.ontouchstart = empezar;
  canvas.ontouchmove = mover;
  canvas.ontouchend = terminar;
}

document.querySelectorAll('[data-limpiar-orden]').forEach(boton => {
  boton.addEventListener('click', () => {
    inicializarFirmaOrden(boton.dataset.limpiarOrden);
  });
});

function canvasEstaFirmadoOrden(idCanvas) {
  return firmasEstadoOrden[idCanvas] && firmasEstadoOrden[idCanvas].tieneTrazo;
}

function canvasABlobOrden(idCanvas) {
  return new Promise(resolve => {
    document.getElementById(idCanvas).toBlob(resolve, 'image/png');
  });
}

document.getElementById('btn-registrar-orden').addEventListener('click', async () => {
  const mensajeError = document.getElementById('mensaje-error-orden');
  mensajeError.textContent = '';

  const clienteId = document.getElementById('orden-cliente').value;
  const servicioId = document.getElementById('orden-servicio').value;
  const notas = document.getElementById('orden-notas').value.trim();

  if (!clienteId) { mensajeError.textContent = 'Selecciona un cliente.'; return; }
  if (!servicioId) { mensajeError.textContent = 'Selecciona el servicio realizado.'; return; }
  if (!fotoArchivoOrden) { mensajeError.textContent = 'Toma una foto del trabajo realizado.'; return; }
  if (!coordenadasOrden) { mensajeError.textContent = 'Captura la ubicación GPS.'; return; }
  if (!canvasEstaFirmadoOrden('firma-cliente-orden')) { mensajeError.textContent = 'Falta la firma del cliente.'; return; }
  if (!canvasEstaFirmadoOrden('firma-tecnico-orden')) { mensajeError.textContent = 'Falta la firma del técnico.'; return; }

  const boton = document.getElementById('btn-registrar-orden');
  boton.disabled = true;
  boton.textContent = 'Guardando...';

  try {
    const idTemporal = crypto.randomUUID();
    const servicio = listaServicios.find(s => s.id === servicioId);

    const extension = fotoArchivoOrden.name.split('.').pop();
    const rutaFoto = `servicios/${idTemporal}/foto.${extension}`;
    await supabaseClient.storage.from('evidencias').upload(rutaFoto, fotoArchivoOrden);
    const { data: urlFoto } = supabaseClient.storage.from('evidencias').getPublicUrl(rutaFoto);

    const blobCliente = await canvasABlobOrden('firma-cliente-orden');
    const rutaFirmaCliente = `servicios/${idTemporal}/firma_cliente.png`;
    await supabaseClient.storage.from('evidencias').upload(rutaFirmaCliente, blobCliente);
    const { data: urlFirmaCliente } = supabaseClient.storage.from('evidencias').getPublicUrl(rutaFirmaCliente);

    const blobTecnico = await canvasABlobOrden('firma-tecnico-orden');
    const rutaFirmaTecnico = `servicios/${idTemporal}/firma_tecnico.png`;
    await supabaseClient.storage.from('evidencias').upload(rutaFirmaTecnico, blobTecnico);
    const { data: urlFirmaTecnico } = supabaseClient.storage.from('evidencias').getPublicUrl(rutaFirmaTecnico);

    const { error: errorOrden } = await supabaseClient.from('servicios_tecnicos').insert({
      cliente_id: clienteId,
      tecnico_id: perfilActual.id,
      servicio_id: servicioId,
      nombre_servicio: servicio ? servicio.nombre : '',
      notas,
      latitud: coordenadasOrden.lat,
      longitud: coordenadasOrden.lng,
      foto_url: urlFoto.publicUrl,
      firma_cliente_url: urlFirmaCliente.publicUrl,
      firma_tecnico_url: urlFirmaTecnico.publicUrl
    });

    if (errorOrden) throw errorOrden;

    await cargarOrdenes();
    document.getElementById('ordenes-formulario').style.display = 'none';
    document.getElementById('ordenes-listado').style.display = 'block';

  } catch (err) {
    mensajeError.textContent = 'Ocurrió un error al guardar la orden. Intenta de nuevo.';
  } finally {
    boton.disabled = false;
    boton.textContent = 'Registrar orden de servicio';
  }
});

async function cargarOrdenes() {
  const contenedor = document.getElementById('lista-ordenes-contenedor');
  const { data, error } = await supabaseClient
    .from('servicios_tecnicos')
    .select('*, clientes(nombre, telefono, direccion, ciudad)')
    .order('fecha', { ascending: false });

  if (error) {
    contenedor.innerHTML = '<p class="subtitulo">Error al cargar las órdenes.</p>';
    return;
  }

  if (data.length === 0) {
    contenedor.innerHTML = '<p class="subtitulo">Todavía no has registrado ninguna orden de servicio.</p>';
    return;
  }

  listaOrdenes = data;

  contenedor.innerHTML = data.map(o => `
    <div class="venta-tarjeta ${o.estado === 'cancelada' ? 'cancelada' : ''}">
      <div class="venta-tarjeta-cabeza">
        <strong>${escaparHtml(o.clientes ? o.clientes.nombre : 'Cliente eliminado')}</strong>
        <span>${new Date(o.fecha).toLocaleString('es-CO')}</span>
      </div>
      <div class="venta-tarjeta-detalle">
        <span>${escaparHtml(o.nombre_servicio || 'Servicio')}</span>
        ${o.estado === 'cancelada' ? '<span class="badge-estado vencida">CANCELADA</span>' : ''}
        ${o.foto_url ? `<a href="${o.foto_url}" target="_blank">Ver foto</a>` : ''}
        ${o.firma_cliente_url ? `<a href="${o.firma_cliente_url}" target="_blank">Firma cliente</a>` : ''}
        ${o.firma_tecnico_url ? `<a href="${o.firma_tecnico_url}" target="_blank">Firma técnico</a>` : ''}
        ${o.latitud ? `<a href="https://www.google.com/maps?q=${o.latitud},${o.longitud}" target="_blank">Ver ubicación</a>` : ''}
      </div>
      ${o.notas ? `<div class="venta-tarjeta-detalle" style="margin-top:6px;"><span>📝 ${escaparHtml(o.notas)}</span></div>` : ''}
      <div class="venta-tarjeta-acciones">
        <button class="btn-icono" onclick="generarReciboOrden('${o.id}')">📄 Recibo PDF</button>
        ${o.estado !== 'cancelada' ? `
          <button class="btn-icono" onclick="abrirNotasOrden('${o.id}', ${JSON.stringify(o.notas || '').replace(/"/g, '&quot;')})">Notas</button>
          <button class="btn-icono peligro" onclick="cancelarOrden('${o.id}')">Cancelar orden</button>
        ` : ''}
      </div>
    </div>
  `).join('');
}

function abrirNotasOrden(id, notasActuales) {
  document.getElementById('notas-orden-id').value = id;
  document.getElementById('notas-orden-texto').value = notasActuales || '';
  document.getElementById('modal-notas-orden').classList.add('activo');
}

document.getElementById('btn-cancelar-notas-orden').addEventListener('click', () => {
  document.getElementById('modal-notas-orden').classList.remove('activo');
});

document.getElementById('form-notas-orden').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('notas-orden-id').value;
  const notas = document.getElementById('notas-orden-texto').value.trim();

  const { error } = await supabaseClient.from('servicios_tecnicos').update({ notas }).eq('id', id);
  if (error) { alert('No se pudieron guardar las notas.'); return; }

  document.getElementById('modal-notas-orden').classList.remove('activo');
  cargarOrdenes();
});

async function cancelarOrden(id) {
  if (!confirm('¿Cancelar esta orden de servicio?')) return;

  const { error } = await supabaseClient.from('servicios_tecnicos').update({ estado: 'cancelada' }).eq('id', id);
  if (error) { alert('No se pudo cancelar la orden.'); return; }

  cargarOrdenes();
}

// ============================================
// RECIBO EN PDF
// ============================================

async function urlAImagenBase64(url) {
  try {
    const respuesta = await fetch(url);
    const blob = await respuesta.blob();
    return await new Promise((resolve, reject) => {
      const lector = new FileReader();
      lector.onloadend = () => resolve(lector.result);
      lector.onerror = reject;
      lector.readAsDataURL(blob);
    });
  } catch (e) {
    return null;
  }
}

async function generarReciboOrden(ordenId) {
  const orden = listaOrdenes.find(o => o.id === ordenId);
  if (!orden) { alert('No se encontró la orden.'); return; }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = 20;

  doc.setFontSize(18);
  doc.setTextColor(23, 27, 38);
  doc.text('TecniSync Pro', 15, y);
  doc.setFontSize(11);
  doc.setTextColor(120, 120, 120);
  doc.text('Orden de Servicio Técnico', 15, y + 7);
  if (orden.estado === 'cancelada') {
    doc.setTextColor(220, 60, 50);
    doc.text('*** ORDEN CANCELADA ***', 140, y);
  }

  y += 20;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text(`Fecha: ${new Date(orden.fecha).toLocaleString('es-CO')}`, 15, y);
  y += 7;
  doc.text(`Cliente: ${orden.clientes ? orden.clientes.nombre : '—'}`, 15, y);
  y += 6;
  if (orden.clientes && orden.clientes.telefono) { doc.text(`Teléfono: ${orden.clientes.telefono}`, 15, y); y += 6; }
  if (orden.clientes && orden.clientes.direccion) { doc.text(`Dirección: ${orden.clientes.direccion}`, 15, y); y += 6; }
  doc.text(`Técnico: ${perfilActual.nombre}`, 15, y);
  y += 12;

  doc.setFont(undefined, 'bold');
  doc.text('Servicio realizado:', 15, y);
  doc.setFont(undefined, 'normal');
  y += 7;
  doc.text(orden.nombre_servicio || '—', 15, y);
  y += 10;

  if (orden.notas) {
    doc.setFont(undefined, 'bold');
    doc.text('Notas:', 15, y);
    doc.setFont(undefined, 'normal');
    y += 7;
    const notasDivididas = doc.splitTextToSize(orden.notas, 180);
    doc.text(notasDivididas, 15, y);
    y += notasDivididas.length * 6 + 6;
  }

  if (orden.latitud) {
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Ubicación registrada: ${orden.latitud.toFixed(5)}, ${orden.longitud.toFixed(5)}`, 15, y);
    y += 10;
    doc.setTextColor(0, 0, 0);
  }

  // Firmas
  y += 5;
  const anchoFirma = 75;
  const altoFirma = 30;

  try {
    if (orden.firma_cliente_url) {
      const imgCliente = await urlAImagenBase64(orden.firma_cliente_url);
      if (imgCliente) doc.addImage(imgCliente, 'PNG', 15, y, anchoFirma, altoFirma);
    }
    if (orden.firma_tecnico_url) {
      const imgTecnico = await urlAImagenBase64(orden.firma_tecnico_url);
      if (imgTecnico) doc.addImage(imgTecnico, 'PNG', 110, y, anchoFirma, altoFirma);
    }
  } catch (e) { /* si falla una firma, seguimos sin ella */ }

  y += altoFirma + 4;
  doc.setFontSize(9);
  doc.text('Firma del Cliente', 15, y);
  doc.text('Firma del Técnico', 110, y);

  y += 15;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generado el ${new Date().toLocaleString('es-CO')} — TecniSync Pro`, 15, y);

  doc.save(`recibo_orden_${ordenId.slice(0, 8)}.pdf`);
}
