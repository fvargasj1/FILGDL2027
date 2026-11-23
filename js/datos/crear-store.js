// Elige el adaptador según config.modo. Ambos exponen: subscribe, getEstado, dispatch, reset, cerrar.
export async function crearStore(config, asistentes) {
  if (config.modo === 'supabase') {
    const { crearStoreSupabase } = await import('./store-supabase.js');
    return crearStoreSupabase({ config, asistentes });
  }
  const { crearStoreDemo } = await import('./store-demo.js');
  return crearStoreDemo({ asistentes });
}

// Quién es la persona en este celular: { id, reinicios } en localStorage.
export function identidad(storage = globalThis.localStorage, clave = 'lab-mi-id') {
  return {
    get() { try { return JSON.parse(storage.getItem(clave)) ?? null; } catch { return null; } },
    set(id, reinicios = 0) { storage.setItem(clave, JSON.stringify({ id, reinicios })); },
    borrar() { storage.removeItem(clave); },
  };
}
