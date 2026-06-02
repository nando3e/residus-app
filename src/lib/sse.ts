type Listener = (data: string) => void;

const listeners = new Set<Listener>();

export function afegirListener(fn: Listener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function emitreEsdeveniment(tipus: string, dades: unknown) {
  const data = JSON.stringify({ tipus, dades, timestamp: new Date().toISOString() });
  listeners.forEach((fn) => fn(data));
}
