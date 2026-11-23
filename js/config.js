// Configuración central de la plataforma. Para pasar a Supabase:
// cambia modo a "supabase" y pega la URL y la clave pública (anon) del proyecto.
export const config = {
  modo: 'demo', // 'demo' | 'supabase'
  supabaseUrl: '',
  supabaseAnonKey: '',
  sesionId: 'lab-2026',
  // Dirección pública de la plataforma. ESTÁ IMPRESA en todos los QR y NFC: no cambiarla después de imprimir.
  // Debe terminar en "/". Si algún día se usa un dominio propio en GitHub Pages, GitHub redirige esta dirección.
  urlPublica: 'https://fvargasj1.github.io/FILGDL2027/',
  metodosUrl: 'https://methods.sagepub.com/research-assistant/',
  // Base de las cartas Liebert. Cuando exista la página propia de Liebert, cambia solo esta línea.
  liebertBaseUrl: 'https://journals.sagepub.com',
  pinFacilitador: '2026',
  nombreEvento: 'Cartas sobre la mesa',
};
