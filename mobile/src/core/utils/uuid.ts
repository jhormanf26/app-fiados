import * as Crypto from 'expo-crypto';

/**
 * Genera un UUID v4 compatible con Android, iOS y Web (incluso en HTTP local)
 */
export function generarUUID(): string {
  try {
    if (typeof Crypto.randomUUID === 'function') {
      const uuid = Crypto.randomUUID();
      if (uuid) return uuid;
    }
  } catch (e) {
    // Fallback si la API nativa de crypto no está disponible en HTTP web
  }

  // Generador universal UUID v4 RFC4122
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
