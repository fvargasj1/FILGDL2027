export function lcg(seed = 42) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32); }
export function ctx(seed = 42) { let n = 0; return { rng: lcg(seed), ahora: () => '2026-12-01T22:30:00Z', nuevoId: () => 'id' + (++n) }; }
export function congelar(o) { if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); for (const v of Object.values(o)) congelar(v); } return o; }
