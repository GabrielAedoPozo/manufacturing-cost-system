/** Zona horaria de la empresa: las fechas se muestran según la hora de Perú. */
const TIME_ZONE = 'America/Lima';

const MONTH_NAMES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

const numberFormatters = new Map<number, Intl.NumberFormat>();

function getNumberFormatter(decimals: number): Intl.NumberFormat {
  let formatter = numberFormatters.get(decimals);
  if (!formatter) {
    formatter = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    numberFormatters.set(decimals, formatter);
  }
  return formatter;
}

/** Primera letra en mayúscula: "octubre 2026" → "Octubre 2026". */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Número con separador de miles: 1200 → "1,200". */
export function formatNumber(value: number, decimals = 0): string {
  return getNumberFormatter(decimals).format(value);
}

/**
 * Monto en soles con separador de miles y 2 decimales: 12480.5 → "S/ 12,480.50".
 * Con `decimals: 0` sirve para ejes de gráficos: 14000 → "S/ 14,000".
 */
export function formatSoles(amount: number, { decimals = 2 }: { decimals?: number } = {}): string {
  const text = formatNumber(Math.abs(amount), decimals);
  const isNegative = amount < 0 && text !== formatNumber(0, decimals);
  return `${isNegative ? '-' : ''}S/ ${text}`;
}

/** Porcentaje con 1 decimal: 4.237 → "4.2%". */
export function formatPercent(value: number, decimals = 1): string {
  return `${formatNumber(value, decimals)}%`;
}

/** Porcentaje con signo explícito: 7.13 → "+7.1%", -1.96 → "-2.0%". */
export function formatSignedPercent(value: number, decimals = 1): string {
  const text = formatPercent(Math.abs(value), decimals);
  if (text === formatPercent(0, decimals)) return text;
  return `${value > 0 ? '+' : '-'}${text}`;
}

/** Fecha ISO (YYYY-MM-DD) a formato corto: "2026-10-22" → "22/10/2026". */
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

/**
 * Mes (YYYY-MM) en texto.
 * - "short": "2026-10" → "Oct 2026"
 * - "long":  "2026-10" → "octubre 2026"
 */
export function formatMonth(month: string, style: 'short' | 'long' = 'long'): string {
  const [year, monthNumber] = month.split('-').map(Number);
  const name = MONTH_NAMES[monthNumber - 1];
  return style === 'short' ? `${capitalize(name.slice(0, 3))} ${year}` : `${name} ${year}`;
}

/** Fecha completa en español: "Viernes, 23 de octubre de 2026". */
export function formatLongDate(date: Date): string {
  const text = new Intl.DateTimeFormat('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: TIME_ZONE,
  }).format(date);
  return capitalize(text);
}

/** Fecha en formato ISO (YYYY-MM-DD) según la zona horaria de la empresa. */
export function toIsoDate(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(date);
}
