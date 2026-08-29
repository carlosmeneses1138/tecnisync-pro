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

// ---------- Utilidad ----------
function escaparHtml(texto) {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}
