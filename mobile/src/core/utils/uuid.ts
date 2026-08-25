export function generarUUID(): string {
  try {
    const Crypto = require('expo-crypto');
    if (typeof Crypto?.randomUUID === 'function') {
      const uuid = Crypto.randomUUID();
      if (uuid) return uuid;
    }
  } catch (e) {
    // Fallback si expo-crypto no está disponible o estamos en Node/Web sin HTTPS
  }

  // Generador universal UUID v4 RFC4122
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
