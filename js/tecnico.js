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
    .select('*, clientes(nombre)')
    .order('fecha', { ascending: false });

  if (error) {
    contenedor.innerHTML = '<p class="subtitulo">Error al cargar las órdenes.</p>';
    return;
  }

  if (data.length === 0) {
    contenedor.innerHTML = '<p class="subtitulo">Todavía no has registrado ninguna orden de servicio.</p>';
    return;
  }

  contenedor.innerHTML = data.map(o => `
    <div class="venta-tarjeta">
      <div class="venta-tarjeta-cabeza">
        <strong>${escaparHtml(o.clientes ? o.clientes.nombre : 'Cliente eliminado')}</strong>
        <span>${new Date(o.fecha).toLocaleString('es-CO')}</span>
      </div>
      <div class="venta-tarjeta-detalle">
        <span>${escaparHtml(o.nombre_servicio || 'Servicio')}</span>
        ${o.foto_url ? `<a href="${o.foto_url}" target="_blank">Ver foto</a>` : ''}
        ${o.firma_cliente_url ? `<a href="${o.firma_cliente_url}" target="_blank">Firma cliente</a>` : ''}
        ${o.firma_tecnico_url ? `<a href="${o.firma_tecnico_url}" target="_blank">Firma técnico</a>` : ''}
        ${o.latitud ? `<a href="https://www.google.com/maps?q=${o.latitud},${o.longitud}" target="_blank">Ver ubicación</a>` : ''}
      </div>
    </div>
  `).join('');
}
