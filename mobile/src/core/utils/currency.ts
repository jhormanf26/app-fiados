/**
 * Utilidades para Formato de Moneda Colombiana (COP) con separadores de miles (puntos)
 */

/**
 * Formatea un valor (texto o número) agregando puntos de miles conforme el usuario escribe.
 * Ejemplo: "200000" -> "200.000", "1500000" -> "1.500.000"
 */
export function formatearMonedaInput(valor: string | number | undefined | null): string {
  if (valor === undefined || valor === null) return '';
  const soloNumeros = String(valor).replace(/\D/g, '');
  if (!soloNumeros) return '';
  return soloNumeros.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Convierte un texto formateado con puntos ("200.000") a un número numérico limpio (200000).
 */
export function desformatearMonedaInput(valor: string | undefined | null): number {
  if (!valor) return 0;
  const soloNumeros = String(valor).replace(/\D/g, '');
  if (!soloNumeros) return 0;
  return parseInt(soloNumeros, 10);
}

/**
 * Formatea un monto numérico para visualización en pantalla con símbolo de moneda $.
 * Ejemplo: 150000 -> "$150.000"
 */
export function formatearCOP(monto: number | undefined | null): string {
  if (monto === undefined || monto === null) return '$0';
  const miles = Math.round(monto).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `$${miles}`;
}
