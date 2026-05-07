/** Performance ratio calculations for yacht specs */

/**
 * Displacement / Length ratio
 * Formula: D/L = (D_long_tons) / (0.01 * LWL_ft)^3
 * where D_long_tons = displacement_kg / 1018
 *       LWL_ft = loa_m / 0.3054
 * Typical values: racer ≈ 100–150, cruiser ≈ 200–300, heavy cruiser ≈ 300–400
 */
export function displacementLengthRatio(
  displacementKg: number | null,
  loaM: number | null,
): number | null {
  if (!displacementKg || !loaM || loaM <= 0) return null;
  const dispLongTons = displacementKg / 1018;
  const lwlFt = loaM / 0.3054;
  const denominator = Math.pow(lwlFt / 100, 3);
  if (denominator === 0) return null;
  return Math.round((dispLongTons / denominator) * 100) / 100;
}

/**
 * Sail Area / Displacement ratio
 * Formula: SA/D = sailArea_m2 / (D_long_tons)^(2/3)
 * where D_long_tons = displacement_kg / 1018
 * Typical values: ≈ 16–20 typical, > 22 performance
 */
export function sailAreaDisplacementRatio(
  sailAreaM2: number | null,
  displacementKg: number | null,
): number | null {
  if (!sailAreaM2 || !displacementKg || displacementKg <= 0) return null;
  const dispLongTons = displacementKg / 1018;
  return Math.round((sailAreaM2 / Math.pow(dispLongTons, 2 / 3)) * 100) / 100;
}

/** Ballast ratio = ballast_kg / displacement_kg * 100  (percentage) */
export function ballastRatio(
  ballastKg: number | null,
  displacementKg: number | null,
): number | null {
  if (!ballastKg || !displacementKg || displacementKg <= 0) return null;
  return Math.round((ballastKg / displacementKg) * 100 * 100) / 100;
}
