// ============================================
// Módulo Administrador — TecniSync Pro
// ============================================

let perfilActual = null;
let listaProductos = [];
let listaServicios = [];

(async () => {
  perfilActual = await protegerPagina('admin');
  if (!perfilActual) return;
  document.getElementById('nombre-usuario').textContent = perfilActual.nombre;

  cargarProductos();
  cargarServicios();
  cargarUsuarios();
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
// PRODUCTOS
// ============================================

async function cargarProductos() {
  const { data, error } = await supabaseClient.from('productos').select('*').order('nombre');
  const cuerpo = document.getElementById('tabla-productos-body');
  if (error) { cuerpo.innerHTML = `<tr><td colspan="5" class="celda-vacia">Error al cargar productos.</td></tr>`; return; }
  listaProductos = data;
  dibujarProductos(listaProductos);
}

function dibujarProductos(productos) {
  const cuerpo = document.getElementById('tabla-productos-body');
  if (productos.length === 0) {
    cuerpo.innerHTML = `<tr><td colspan="5" class="celda-vacia">No hay productos. Crea el primero.</td></tr>`;
    return;
  }
  cuerpo.innerHTML = productos.map(p => `
    <tr>
      <td>${escaparHtml(p.nombre)}</td>
      <td><span class="chip-tipo">${escaparHtml(p.categoria || 'General')}</span></td>
      <td>$${Number(p.precio).toLocaleString('es-CO')}</td>
      <td>${p.stock}</td>
      <td class="acciones-fila">
        <button class="btn-icono" onclick="editarProducto('${p.id}')">Editar</button>
        <button class="btn-icono peligro" onclick="borrarProducto('${p.id}')">Borrar</button>
      </td>
    </tr>
  `).join('');
}

document.getElementById('buscador-productos').addEventListener('input', (e) => {
  const t = e.target.value.toLowerCase();
  dibujarProductos(listaProductos.filter(p => p.nombre.toLowerCase().includes(t)));
});

const modalProducto = document.getElementById('modal-producto');
const formProducto = document.getElementById('form-producto');

document.getElementById('btn-nuevo-producto').addEventListener('click', () => {
  formProducto.reset();
  document.getElementById('producto-id').value = '';
  document.getElementById('titulo-modal-producto').textContent = 'Nuevo producto';
  document.getElementById('mensaje-error-producto').textContent = '';
  modalProducto.classList.add('activo');
});

document.getElementById('btn-cancelar-producto').addEventListener('click', () => {
  modalProducto.classList.remove('activo');
});

function editarProducto(id) {
  const p = listaProductos.find(x => x.id === id);
  if (!p) return;
  document.getElementById('producto-id').value = p.id;
  document.getElementById('producto-nombre').value = p.nombre || '';
  document.getElementById('producto-descripcion').value = p.descripcion || '';
  document.getElementById('producto-categoria').value = p.categoria || '';
  document.getElementById('producto-precio').value = p.precio || 0;
  document.getElementById('producto-stock').value = p.stock || 0;
  document.getElementById('titulo-modal-producto').textContent = 'Editar producto';
  document.getElementById('mensaje-error-producto').textContent = '';
  modalProducto.classList.add('activo');
}

async function borrarProducto(id) {
  if (!confirm('¿Borrar este producto?')) return;
  const { error } = await supabaseClient.from('productos').delete().eq('id', id);
  if (error) { alert('No se pudo borrar.'); return; }
  cargarProductos();
}

formProducto.addEventListener('submit', async (e) => {
  e.preventDefault();
  const mensajeError = document.getElementById('mensaje-error-producto');
  mensajeError.textContent = '';

  const id = document.getElementById('producto-id').value;
  const datos = {
    nombre: document.getElementById('producto-nombre').value.trim(),
    descripcion: document.getElementById('producto-descripcion').value.trim(),
    categoria: document.getElementById('producto-categoria').value.trim(),
    precio: parseFloat(document.getElementById('producto-precio').value),
    stock: parseInt(document.getElementById('producto-stock').value),
  };

  let error;
  if (id) {
    ({ error } = await supabaseClient.from('productos').update(datos).eq('id', id));
  } else {
    ({ error } = await supabaseClient.from('productos').insert(datos));
  }

  if (error) { mensajeError.textContent = 'No se pudo guardar.'; return; }
  modalProducto.classList.remove('activo');
  cargarProductos();
});

// ============================================
// SERVICIOS
// ============================================

async function cargarServicios() {
  const { data, error } = await supabaseClient.from('servicios').select('*').order('nombre');
  const cuerpo = document.getElementById('tabla-servicios-body');
  if (error) { cuerpo.innerHTML = `<tr><td colspan="4" class="celda-vacia">Error al cargar servicios.</td></tr>`; return; }
  listaServicios = data;
  dibujarServicios(listaServicios);
}

function dibujarServicios(servicios) {
  const cuerpo = document.getElementById('tabla-servicios-body');
  if (servicios.length === 0) {
    cuerpo.innerHTML = `<tr><td colspan="4" class="celda-vacia">No hay servicios. Crea el primero.</td></tr>`;
    return;
  }
  cuerpo.innerHTML = servicios.map(s => `
    <tr>
      <td>${escaparHtml(s.nombre)}</td>
      <td>${escaparHtml(s.descripcion || '—')}</td>
      <td>${s.precio ? '$' + Number(s.precio).toLocaleString('es-CO') : '—'}</td>
      <td class="acciones-fila">
        <button class="btn-icono" onclick="editarServicio('${s.id}')">Editar</button>
        <button class="btn-icono peligro" onclick="borrarServicio('${s.id}')">Borrar</button>
      </td>
    </tr>
  `).join('');
}

document.getElementById('buscador-servicios').addEventListener('input', (e) => {
  const t = e.target.value.toLowerCase();
  dibujarServicios(listaServicios.filter(s => s.nombre.toLowerCase().includes(t)));
});

const modalServicio = document.getElementById('modal-servicio');
const formServicio = document.getElementById('form-servicio');

document.getElementById('btn-nuevo-servicio').addEventListener('click', () => {
  formServicio.reset();
  document.getElementById('servicio-id').value = '';
  document.getElementById('titulo-modal-servicio').textContent = 'Nuevo servicio';
  document.getElementById('mensaje-error-servicio').textContent = '';
  modalServicio.classList.add('activo');
});

document.getElementById('btn-cancelar-servicio').addEventListener('click', () => {
  modalServicio.classList.remove('activo');
});

function editarServicio(id) {
  const s = listaServicios.find(x => x.id === id);
  if (!s) return;
  document.getElementById('servicio-id').value = s.id;
  document.getElementById('servicio-nombre').value = s.nombre || '';
  document.getElementById('servicio-descripcion').value = s.descripcion || '';
  document.getElementById('servicio-precio').value = s.precio || '';
  document.getElementById('titulo-modal-servicio').textContent = 'Editar servicio';
  document.getElementById('mensaje-error-servicio').textContent = '';
  modalServicio.classList.add('activo');
}

async function borrarServicio(id) {
  if (!confirm('¿Borrar este servicio?')) return;
  const { error } = await supabaseClient.from('servicios').delete().eq('id', id);
  if (error) { alert('No se pudo borrar.'); return; }
  cargarServicios();
}

formServicio.addEventListener('submit', async (e) => {
  e.preventDefault();
  const mensajeError = document.getElementById('mensaje-error-servicio');
  mensajeError.textContent = '';

  const id = document.getElementById('servicio-id').value;
  const datos = {
    nombre: document.getElementById('servicio-nombre').value.trim(),
    descripcion: document.getElementById('servicio-descripcion').value.trim(),
    precio: document.getElementById('servicio-precio').value ? parseFloat(document.getElementById('servicio-precio').value) : null,
  };

  let error;
  if (id) {
    ({ error } = await supabaseClient.from('servicios').update(datos).eq('id', id));
  } else {
    ({ error } = await supabaseClient.from('servicios').insert(datos));
  }

  if (error) { mensajeError.textContent = 'No se pudo guardar.'; return; }
  modalServicio.classList.remove('activo');
  cargarServicios();
});

// ============================================
// USUARIOS (solo lectura por ahora)
// ============================================

async function cargarUsuarios() {
  const { data, error } = await supabaseClient.from('perfiles').select('*').order('rol');
  const cuerpo = document.getElementById('tabla-usuarios-body');
  if (error) { cuerpo.innerHTML = `<tr><td colspan="3" class="celda-vacia">Error al cargar usuarios.</td></tr>`; return; }

  if (data.length === 0) {
    cuerpo.innerHTML = `<tr><td colspan="3" class="celda-vacia">No hay usuarios.</td></tr>`;
    return;
  }

  cuerpo.innerHTML = data.map(u => `
    <tr>
      <td>${escaparHtml(u.nombre)}</td>
      <td><span class="chip-tipo">${u.rol}</span></td>
      <td style="font-family: var(--fuente-mono); font-size:12px; color:#9AA3B8;">${u.id}</td>
    </tr>
  `).join('');
}
