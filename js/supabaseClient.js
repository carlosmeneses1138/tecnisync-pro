// ============================================
// Conexión a Supabase — TecniSync Pro
// ============================================
// Estos datos son públicos y seguros de exponer en el navegador
// (la seguridad real la da RLS, no el secreto de esta clave)

const SUPABASE_URL = 'https://amoxsrglvzywmyvtnqck.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtb3hzcmdsdnp5d215dnRucWNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5NjY3MTQsImV4cCI6MjEwMzU0MjcxNH0.GtHgdLQV7Rsn2lNJmt6fug_rtg68Ee8ttfd-W1MWJfU';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Revisa que haya sesión activa y que el rol coincida con el permitido.
// Si no, devuelve al usuario al login. Se usa en cada página protegida.
async function protegerPagina(rolPermitido) {
  const { data: { session } } = await supabaseClient.auth.getSession();

  if (!session) {
    window.location.href = 'index.html';
    return null;
  }

  const { data: perfil, error } = await supabaseClient
    .from('perfiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (error || !perfil || perfil.rol !== rolPermitido) {
    await supabaseClient.auth.signOut();
    window.location.href = 'index.html';
    return null;
  }

  return perfil;
}

async function cerrarSesion() {
  await supabaseClient.auth.signOut();
  window.location.href = 'index.html';
}
