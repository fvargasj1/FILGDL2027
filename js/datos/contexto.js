// Fuente de aleatoriedad, hora e ids para las acciones (inyectada por los stores).
export function contextoReal() {
  return {
    rng: Math.random,
    ahora: () => new Date().toISOString(),
    nuevoId: () => (globalThis.crypto?.randomUUID?.() ?? 'id' + Date.now().toString(36) + Math.random().toString(36).slice(2)),
  };
}
