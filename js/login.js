// ============================================
// Login — TecniSync Pro
// ============================================

let rolSeleccionado = 'admin';

const botonesRol = document.querySelectorAll('.breaker');
const form = document.getElementById('form-login');
const mensajeError = document.getElementById('mensaje-error');
const botonSubmit = document.getElementById('btn-ingresar');
const tituloRol = document.getElementById('titulo-rol');

const nombresRol = {
  admin: 'Administrador',
  vendedor: 'Vendedor',
  tecnico: 'Técnico'
};

botonesRol.forEach(boton => {
  boton.addEventListener('click', () => {
    botonesRol.forEach(b => b.classList.remove('activo'));
    boton.classList.add('activo');
    rolSeleccionado = boton.dataset.rol;
    tituloRol.textContent = nombresRol[rolSeleccionado];
  });
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  mensajeError.textContent = '';
  botonSubmit.disabled = true;
  botonSubmit.textContent = 'Verificando...';

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

  if (error) {
    mensajeError.textContent = 'Correo o contraseña incorrectos.';
    botonSubmit.disabled = false;
    botonSubmit.textContent = 'Ingresar';
    return;
  }

  // Buscamos el rol REAL del usuario en la base de datos
  // (no confiamos solo en el botón que seleccionó en pantalla)
  const { data: perfil, error: errorPerfil } = await supabaseClient
    .from('perfiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (errorPerfil || !perfil) {
    mensajeError.textContent = 'Tu usuario no tiene un perfil asignado. Contacta al administrador.';
    await supabaseClient.auth.signOut();
    botonSubmit.disabled = false;
    botonSubmit.textContent = 'Ingresar';
    return;
  }

  const destinos = {
    admin: 'admin.html',
    vendedor: 'vendedor.html',
    tecnico: 'tecnico.html'
  };

  window.location.href = destinos[perfil.rol];
});
