/** Redondea un monto en soles al céntimo. */
export function roundToCents(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Redondea varios valores a enteros que suman exactamente `target`, usando el método
 * del mayor residuo: se trunca cada valor y las unidades que faltan van a los que
 * tenían la mayor parte decimal.
 */
export function largestRemainder(values: readonly number[], target: number): number[] {
  const units = values.map(Math.floor);
  let missing = target - units.reduce((sum, unit) => sum + unit, 0);

  const byRemainder = values
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder);
  for (const { index } of byRemainder) {
    if (missing <= 0) break;
    units[index] += 1;
    missing -= 1;
  }

  return units;
}
