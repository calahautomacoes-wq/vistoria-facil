/**
 * Gera um UUID v4 compatível com todos os browsers, incluindo iOS Safari < 15.4.
 * crypto.randomUUID() só existe a partir do iOS 15.4 — este polyfill usa
 * crypto.getRandomValues() que está disponível desde o iOS 6.
 */
export function uuid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Polyfill seguro via getRandomValues
  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
    (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
  )
}
