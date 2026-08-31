// ============================================
// Módulo Vendedor — TecniSync Pro
// ============================================

let perfilActual = null;
let listaClientes = [];
let listaProductos = [];

// ---------- Arranque de la página ----------
(async () => {
  perfilActual = await protegerPagina('vendedor');
  if (!perfilActual) return;
  document.getElementById('nombre-usuario').textContent = perfilActual.nombre;

  cargarClientes();
  cargarProductos();
  cargarVentas();
})();

// ---------- Navegación entre tabs ----------
document.querySelectorAll('.tab-modulo').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab-modulo').forEach(t => t.classList.remove('activo'));
    document.querySelectorAll('.vista').forEach(v => v.classList.remove('activa'));
    tab.classList.add('activo');
    document.getElementById('vista-' + tab.dataset.vista).classList.add('activa');
  });
});

// ============================================
// CLIENTES
// ============================================

async function cargarClientes() {
  const { data, error } = await supabaseClient
    .from('clientes')
    .select('*')
    .order('creado_en', { ascending: false });

  const cuerpo = document.getElementById('tabla-clientes-body');

  if (error) {
    cuerpo.innerHTML = `<tr><td colspan="5" class="celda-vacia">Error al cargar clientes.</td></tr>`;
    return;
  }

  listaClientes = data;
  dibujarClientes(listaClientes);
}

function dibujarClientes(clientes) {
  const cuerpo = document.getElementById('tabla-clientes-body');

  if (clientes.length === 0) {
    cuerpo.innerHTML = `<tr><td colspan="5" class="celda-vacia">Todavía no hay clientes registrados. Crea el primero con "+ Nuevo cliente".</td></tr>`;
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
  const filtrados = listaClientes.filter(c => c.nombre.toLowerCase().includes(texto));
  dibujarClientes(filtrados);
});

// ---- Modal de cliente ----
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
  if (!confirm('¿Seguro que quieres borrar este cliente? Esta acción no se puede deshacer.')) return;

  const { error } = await supabaseClient.from('clientes').delete().eq('id', id);
  if (error) {
    alert('No se pudo borrar el cliente.');
    return;
  }
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

  if (error) {
    mensajeError.textContent = 'No se pudo guardar. Intenta de nuevo.';
    return;
  }

  modalCliente.classList.remove('activo');
  cargarClientes();
});

// ============================================
// PRODUCTOS (solo lectura por ahora)
// ============================================

async function cargarProductos() {
  const { data, error } = await supabaseClient
    .from('productos')
    .select('*')
    .order('nombre', { ascending: true });

  const cuerpo = document.getElementById('tabla-productos-body');

  if (error) {
    cuerpo.innerHTML = `<tr><td colspan="4" class="celda-vacia">Error al cargar productos.</td></tr>`;
    return;
  }

  listaProductos = data;
  dibujarProductos(listaProductos);
}

function dibujarProductos(productos) {
  const cuerpo = document.getElementById('tabla-productos-body');

  if (productos.length === 0) {
    cuerpo.innerHTML = `<tr><td colspan="4" class="celda-vacia">Todavía no hay productos cargados. El administrador puede agregarlos.</td></tr>`;
    return;
  }

  cuerpo.innerHTML = productos.map(p => `
    <tr>
      <td>${escaparHtml(p.nombre)}</td>
      <td><span class="chip-tipo">${escaparHtml(p.categoria || 'General')}</span></td>
      <td>$${Number(p.precio).toLocaleString('es-CO')}</td>
      <td>${p.stock}</td>
    </tr>
  `).join('');
}

document.getElementById('buscador-productos').addEventListener('input', (e) => {
  const texto = e.target.value.toLowerCase();
  const filtrados = listaProductos.filter(p => p.nombre.toLowerCase().includes(texto));
  dibujarProductos(filtrados);
});

// ============================================
// VENTAS
// ============================================

let carrito = [];
let fotoArchivo = null;
let coordenadasVenta = null;
let listaVentas = [];

document.getElementById('btn-nueva-venta').addEventListener('click', () => {
  abrirFormularioVenta();
});

document.getElementById('btn-volver-listado').addEventListener('click', () => {
  document.getElementById('ventas-formulario').style.display = 'none';
  document.getElementById('ventas-listado').style.display = 'block';
});

function abrirFormularioVenta() {
  // Reiniciar todo el formulario
  carrito = [];
  fotoArchivo = null;
  coordenadasVenta = null;
  document.getElementById('venta-cliente').value = '';
  document.getElementById('venta-foto-input').value = '';
  document.getElementById('venta-foto-preview').style.display = 'none';
  document.getElementById('estado-gps').textContent = 'Todavía no se ha capturado la ubicación.';
  document.getElementById('estado-gps').classList.remove('ok');
  document.getElementById('mensaje-error-venta').textContent = '';
  dibujarCarrito();

  poblarSelectClientes();
  poblarSelectProductos();
  inicializarFirma('firma-cliente');
  inicializarFirma('firma-vendedor');

  document.getElementById('ventas-listado').style.display = 'none';
  document.getElementById('ventas-formulario').style.display = 'block';
}

function poblarSelectClientes() {
  const select = document.getElementById('venta-cliente');
  select.innerHTML = '<option value="">Selecciona un cliente...</option>' +
    listaClientes.map(c => `<option value="${c.id}">${escaparHtml(c.nombre)}</option>`).join('');
}

function poblarSelectProductos() {
  const select = document.getElementById('venta-producto-select');
  select.innerHTML = listaProductos.map(p =>
    `<option value="${p.id}">${escaparHtml(p.nombre)} — $${Number(p.precio).toLocaleString('es-CO')}</option>`
  ).join('');
}

// ---- Carrito ----
document.getElementById('btn-agregar-producto').addEventListener('click', () => {
  const productoId = document.getElementById('venta-producto-select').value;
  const cantidad = parseInt(document.getElementById('venta-producto-cantidad').value) || 1;
  const producto = listaProductos.find(p => p.id === productoId);
  if (!producto) return;

  const existente = carrito.find(item => item.producto_id === productoId);
  if (existente) {
    existente.cantidad += cantidad;
  } else {
    carrito.push({
      producto_id: producto.id,
      nombre_producto: producto.nombre,
      cantidad: cantidad,
      precio_unitario: producto.precio
    });
  }
  dibujarCarrito();
});

function dibujarCarrito() {
  const contenedor = document.getElementById('carrito-lista');
  if (carrito.length === 0) {
    contenedor.innerHTML = '<p style="color:#9AA3B8; font-size:13px;">Todavía no has agregado productos.</p>';
  } else {
    contenedor.innerHTML = carrito.map((item, i) => `
      <div class="carrito-item">
        <span>${item.cantidad} × ${escaparHtml(item.nombre_producto)}</span>
        <span>
          $${(item.cantidad * item.precio_unitario).toLocaleString('es-CO')}
          <button type="button" class="btn-quitar" onclick="quitarDelCarrito(${i})">Quitar</button>
        </span>
      </div>
    `).join('');
  }
  const total = carrito.reduce((sum, item) => sum + (item.cantidad * item.precio_unitario), 0);
  document.getElementById('carrito-total-monto').textContent = '$' + total.toLocaleString('es-CO');
}

function quitarDelCarrito(indice) {
  carrito.splice(indice, 1);
  dibujarCarrito();
}

// ---- Foto ----
document.getElementById('venta-foto-input').addEventListener('change', (e) => {
  const archivo = e.target.files[0];
  if (!archivo) return;
  fotoArchivo = archivo;
  const preview = document.getElementById('venta-foto-preview');
  preview.src = URL.createObjectURL(archivo);
  preview.style.display = 'block';
});

// ---- GPS ----
document.getElementById('btn-obtener-gps').addEventListener('click', () => {
  const estado = document.getElementById('estado-gps');
  estado.textContent = 'Buscando tu ubicación...';
  estado.classList.remove('ok');

  if (!navigator.geolocation) {
    estado.textContent = 'Tu navegador no soporta geolocalización.';
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (posicion) => {
      coordenadasVenta = {
        lat: posicion.coords.latitude,
        lng: posicion.coords.longitude
      };
      estado.textContent = `Ubicación capturada: ${coordenadasVenta.lat.toFixed(5)}, ${coordenadasVenta.lng.toFixed(5)}`;
      estado.classList.add('ok');
    },
    (error) => {
      estado.textContent = 'No se pudo obtener la ubicación. Revisa los permisos de GPS.';
    },
    { enableHighAccuracy: true }
  );
});

// ---- Firma digital (dibujada a mano en canvas) ----
const firmasEstado = {};

function inicializarFirma(idCanvas) {
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

  firmasEstado[idCanvas] = { dibujando: false, tieneTrazo: false, ctx };

  function posicion(e) {
    const rect = canvas.getBoundingClientRect();
    const punto = e.touches ? e.touches[0] : e;
    return { x: punto.clientX - rect.left, y: punto.clientY - rect.top };
  }

  function empezar(e) {
    e.preventDefault();
    firmasEstado[idCanvas].dibujando = true;
    firmasEstado[idCanvas].tieneTrazo = true;
    const p = posicion(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  }

  function mover(e) {
    if (!firmasEstado[idCanvas].dibujando) return;
    e.preventDefault();
    const p = posicion(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }

  function terminar() {
    firmasEstado[idCanvas].dibujando = false;
  }

  canvas.onmousedown = empezar;
  canvas.onmousemove = mover;
  canvas.onmouseup = terminar;
  canvas.onmouseleave = terminar;
  canvas.ontouchstart = empezar;
  canvas.ontouchmove = mover;
  canvas.ontouchend = terminar;
}

document.querySelectorAll('[data-limpiar]').forEach(boton => {
  boton.addEventListener('click', () => {
    inicializarFirma(boton.dataset.limpiar);
  });
});

function canvasEstaFirmado(idCanvas) {
  return firmasEstado[idCanvas] && firmasEstado[idCanvas].tieneTrazo;
}

function canvasABlob(idCanvas) {
  return new Promise(resolve => {
    document.getElementById(idCanvas).toBlob(resolve, 'image/png');
  });
}

// ---- Registrar venta ----
document.getElementById('btn-registrar-venta').addEventListener('click', async () => {
  const mensajeError = document.getElementById('mensaje-error-venta');
  mensajeError.textContent = '';

  const clienteId = document.getElementById('venta-cliente').value;

  if (!clienteId) { mensajeError.textContent = 'Selecciona un cliente.'; return; }
  if (carrito.length === 0) { mensajeError.textContent = 'Agrega al menos un producto.'; return; }
  if (!fotoArchivo) { mensajeError.textContent = 'Toma una foto del trabajo o producto entregado.'; return; }
  if (!coordenadasVenta) { mensajeError.textContent = 'Captura la ubicación GPS.'; return; }
  if (!canvasEstaFirmado('firma-cliente')) { mensajeError.textContent = 'Falta la firma del cliente.'; return; }
  if (!canvasEstaFirmado('firma-vendedor')) { mensajeError.textContent = 'Falta la firma del vendedor.'; return; }

  const boton = document.getElementById('btn-registrar-venta');
  boton.disabled = true;
  boton.textContent = 'Guardando...';

  try {
    const idTemporal = crypto.randomUUID();

    // Subir foto
    const extension = fotoArchivo.name.split('.').pop();
    const rutaFoto = `ventas/${idTemporal}/foto.${extension}`;
    await supabaseClient.storage.from('evidencias').upload(rutaFoto, fotoArchivo);
    const { data: urlFoto } = supabaseClient.storage.from('evidencias').getPublicUrl(rutaFoto);

    // Subir firmas
    const blobCliente = await canvasABlob('firma-cliente');
    const rutaFirmaCliente = `ventas/${idTemporal}/firma_cliente.png`;
    await supabaseClient.storage.from('evidencias').upload(rutaFirmaCliente, blobCliente);
    const { data: urlFirmaCliente } = supabaseClient.storage.from('evidencias').getPublicUrl(rutaFirmaCliente);

    const blobVendedor = await canvasABlob('firma-vendedor');
    const rutaFirmaVendedor = `ventas/${idTemporal}/firma_vendedor.png`;
    await supabaseClient.storage.from('evidencias').upload(rutaFirmaVendedor, blobVendedor);
    const { data: urlFirmaVendedor } = supabaseClient.storage.from('evidencias').getPublicUrl(rutaFirmaVendedor);

    const total = carrito.reduce((sum, item) => sum + (item.cantidad * item.precio_unitario), 0);

    // Insertar la venta
    const { data: ventaCreada, error: errorVenta } = await supabaseClient
      .from('ventas')
      .insert({
        cliente_id: clienteId,
        vendedor_id: perfilActual.id,
        total,
        latitud: coordenadasVenta.lat,
        longitud: coordenadasVenta.lng,
        foto_url: urlFoto.publicUrl,
        firma_cliente_url: urlFirmaCliente.publicUrl,
        firma_vendedor_url: urlFirmaVendedor.publicUrl
      })
      .select()
      .single();

    if (errorVenta) throw errorVenta;

    // Insertar los productos de la venta
    const items = carrito.map(item => ({
      venta_id: ventaCreada.id,
      producto_id: item.producto_id,
      nombre_producto: item.nombre_producto,
      cantidad: item.cantidad,
      precio_unitario: item.precio_unitario
    }));
    await supabaseClient.from('venta_items').insert(items);

    // Descontar el stock de cada producto
    for (const item of carrito) {
      const producto = listaProductos.find(p => p.id === item.producto_id);
      if (producto) {
        await supabaseClient.from('productos')
          .update({ stock: Math.max(0, producto.stock - item.cantidad) })
          .eq('id', item.producto_id);
      }
    }

    await cargarProductos();
    await cargarVentas();
    document.getElementById('ventas-formulario').style.display = 'none';
    document.getElementById('ventas-listado').style.display = 'block';

  } catch (err) {
    mensajeError.textContent = 'Ocurrió un error al guardar la venta. Intenta de nuevo.';
  } finally {
    boton.disabled = false;
    boton.textContent = 'Registrar venta';
  }
});

// ---- Listado de ventas ----
async function cargarVentas() {
  const contenedor = document.getElementById('lista-ventas-contenedor');
  const { data, error } = await supabaseClient
    .from('ventas')
    .select('*, clientes(nombre)')
    .order('fecha', { ascending: false });

  if (error) {
    contenedor.innerHTML = '<p class="subtitulo">Error al cargar las ventas.</p>';
    return;
  }

  listaVentas = data;

  if (data.length === 0) {
    contenedor.innerHTML = '<p class="subtitulo">Todavía no has registrado ninguna venta.</p>';
    return;
  }

  contenedor.innerHTML = data.map(v => `
    <div class="venta-tarjeta ${v.estado === 'cancelada' ? 'cancelada' : ''}">
      <div class="venta-tarjeta-cabeza">
        <strong>${escaparHtml(v.clientes ? v.clientes.nombre : 'Cliente eliminado')}</strong>
        <span>${new Date(v.fecha).toLocaleString('es-CO')}</span>
      </div>
      <div class="venta-tarjeta-detalle">
        <span>Total: $${Number(v.total).toLocaleString('es-CO')}</span>
        ${v.estado === 'cancelada' ? '<span class="badge-estado vencida">CANCELADA</span>' : ''}
        ${v.foto_url ? `<a href="${v.foto_url}" target="_blank">Ver foto</a>` : ''}
        ${v.firma_cliente_url ? `<a href="${v.firma_cliente_url}" target="_blank">Firma cliente</a>` : ''}
        ${v.firma_vendedor_url ? `<a href="${v.firma_vendedor_url}" target="_blank">Firma vendedor</a>` : ''}
        ${v.latitud ? `<a href="https://www.google.com/maps?q=${v.latitud},${v.longitud}" target="_blank">Ver ubicación</a>` : ''}
      </div>
      ${v.notas ? `<div class="venta-tarjeta-detalle" style="margin-top:6px;"><span>📝 ${escaparHtml(v.notas)}</span></div>` : ''}
      ${v.estado !== 'cancelada' ? `
        <div class="venta-tarjeta-acciones">
          <button class="btn-icono" onclick="abrirNotasVenta('${v.id}', ${JSON.stringify(v.notas || '').replace(/"/g, '&quot;')})">Notas</button>
          <button class="btn-icono peligro" onclick="cancelarVenta('${v.id}')">Cancelar venta</button>
        </div>
      ` : ''}
    </div>
  `).join('');
}

function abrirNotasVenta(id, notasActuales) {
  document.getElementById('notas-venta-id').value = id;
  document.getElementById('notas-venta-texto').value = notasActuales || '';
  document.getElementById('modal-notas-venta').classList.add('activo');
}

document.getElementById('btn-cancelar-notas-venta').addEventListener('click', () => {
  document.getElementById('modal-notas-venta').classList.remove('activo');
});

document.getElementById('form-notas-venta').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('notas-venta-id').value;
  const notas = document.getElementById('notas-venta-texto').value.trim();

  const { error } = await supabaseClient.from('ventas').update({ notas }).eq('id', id);
  if (error) { alert('No se pudieron guardar las notas.'); return; }

  document.getElementById('modal-notas-venta').classList.remove('activo');
  cargarVentas();
});

async function cancelarVenta(id) {
  if (!confirm('¿Cancelar esta venta? El stock de los productos se devolverá automáticamente al inventario.')) return;

  const { data, error } = await supabaseClient.functions.invoke('cancelar-venta', {
    body: { venta_id: id }
  });

  if (error || (data && data.error)) {
    alert((data && data.error) ? data.error : 'No se pudo cancelar la venta.');
    return;
  }

  await cargarProductos();
  await cargarVentas();
}

// ---------- Utilidad ----------
function escaparHtml(texto) {
  const div = document.createElement('div');
  div.textContent = texto || '';
  return div.innerHTML;
}
