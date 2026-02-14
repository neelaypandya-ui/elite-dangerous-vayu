/**
 * @vayu/shared — Math Utilities
 *
 * Mathematical helpers for Elite Dangerous calculations, including
 * 3D system distances, FSD fuel/range formulas, temperature conversion,
 * and general numeric formatting.
 */

// ---------------------------------------------------------------------------
// 3D Distance
// ---------------------------------------------------------------------------

/**
 * Calculate the Euclidean distance between two star systems in 3D space.
 *
 * Coordinates are in light years relative to Sol (the galactic reference frame).
 *
 * @param a - [x, y, z] coordinates of the first system.
 * @param b - [x, y, z] coordinates of the second system.
 * @returns Distance in light years.
 */
export function systemDistance(
  a: [number, number, number],
  b: [number, number, number],
): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const dz = b[2] - a[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// ---------------------------------------------------------------------------
// FSD Calculations
// ---------------------------------------------------------------------------

/**
 * Calculate fuel consumption for a single hyperspace jump.
 *
 * The game uses the formula:
 *   FuelUsed = FuelMultiplier * distance^FuelPower
 *
 * @param distance       - Jump distance in light years.
 * @param fuelMultiplier - The FSD's fuel multiplier constant.
 * @param fuelPower      - The FSD's fuel power exponent.
 * @returns Fuel consumed in tons.
 */
export function fuelCost(
  distance: number,
  fuelMultiplier: number,
  fuelPower: number,
): number {
  if (distance <= 0) return 0;
  return fuelMultiplier * Math.pow(distance, fuelPower);
}

/**
 * Calculate the maximum single-jump range for an FSD.
 *
 * Derived by inverting the fuel formula:
 *   MaxRange = ( MaxFuelPerJump / FuelMultiplier ) ^ (1 / FuelPower) / (ShipMass + FuelMass)^(1/FuelPower) * (ShipMass + FuelMass)^(1/FuelPower)
 *
 * Simplified standard formula used by the community:
 *   MaxRange = (MaxFuelPerJump / FuelMultiplier)^(1 / FuelPower)
 *
 * The game's actual formula accounts for the ship's total mass:
 *   FuelUsed = FuelMultiplier * (distance * (shipMass + fuelMass) / OptimalMass)^FuelPower
 *
 * For a simplified calculation that matches community tools:
 *   MaxRange = OptimalMass / (shipMass + fuelMass) * (MaxFuelPerJump / FuelMultiplier)^(1/FuelPower)
 *
 * This function uses the simplified form; for full accuracy the caller
 * should also factor in the FSD's OptimalMass.
 *
 * @param fsdMaxFuelPerJump - Maximum fuel per single jump (tons).
 * @param fuelPower         - FSD fuel power exponent.
 * @param fuelMultiplier    - FSD fuel multiplier constant.
 * @param shipMass          - Dry mass of the ship (tons, unladen).
 * @param fuelMass          - Current fuel in the tank (tons).
 * @returns Maximum jump range in light years.
 */
export function maxJumpRange(
  fsdMaxFuelPerJump: number,
  fuelPower: number,
  fuelMultiplier: number,
  shipMass: number,
  fuelMass: number,
): number {
  if (fuelMultiplier <= 0 || fuelPower <= 0 || shipMass + fuelMass <= 0) {
    return 0;
  }

  // Simplified formula: range = (maxFuel / multiplier)^(1/power) / totalMass * optimalMass
  // Since we don't have optimalMass here, we use the most basic form.
  const totalMass = shipMass + fuelMass;
  const range = Math.pow(fsdMaxFuelPerJump / fuelMultiplier, 1 / fuelPower) / totalMass;

  return Math.max(0, range);
}

// ---------------------------------------------------------------------------
// Temperature
// ---------------------------------------------------------------------------

/**
 * Convert a temperature from Kelvin to Celsius.
 *
 * @param k - Temperature in Kelvin.
 * @returns Temperature in Celsius.
 */
export function kelvinToCelsius(k: number): number {
  return k - 273.15;
}

// ---------------------------------------------------------------------------
// Number formatting
// ---------------------------------------------------------------------------

/**
 * Format a large number with SI-style suffixes.
 *
 * Examples:
 *   1_500         -> "1.5K"
 *   1_500_000     -> "1.5M"
 *   1_500_000_000 -> "1.5B"
 *   42            -> "42"
 *
 * Thresholds:
 *   T = trillions (10^12)
 *   B = billions  (10^9)
 *   M = millions  (10^6)
 *   K = thousands (10^3)
 *
 * @param n        - The number to format.
 * @param decimals - Decimal places for the suffixed value (default: 1).
 */
export function formatSI(n: number, decimals: number = 1): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';

  if (abs >= 1_000_000_000_000) {
    return `${sign}${(abs / 1_000_000_000_000).toFixed(decimals)}T`;
  }
  if (abs >= 1_000_000_000) {
    return `${sign}${(abs / 1_000_000_000).toFixed(decimals)}B`;
  }
  if (abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toFixed(decimals)}M`;
  }
  if (abs >= 1_000) {
    return `${sign}${(abs / 1_000).toFixed(decimals)}K`;
  }

  return `${sign}${abs}`;
}

// ---------------------------------------------------------------------------
// Trade calculations
// ---------------------------------------------------------------------------

/**
 * Calculate the profit margin percentage between a buy and sell price.
 *
 * Returns `(sell - buy) / buy * 100`. Returns 0 if buy is zero.
 *
 * @param buy  - Purchase price per unit.
 * @param sell - Sale price per unit.
 * @returns Profit margin as a percentage.
 */
export function profitMargin(buy: number, sell: number): number {
  if (buy === 0) return 0;
  return ((sell - buy) / buy) * 100;
}

// ---------------------------------------------------------------------------
// General math helpers
// ---------------------------------------------------------------------------

/**
 * Clamp a number between a minimum and maximum value.
 *
 * @param value - The input value.
 * @param min   - The lower bound (inclusive).
 * @param max   - The upper bound (inclusive).
 */
export function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

/**
 * Linear interpolation between two values.
 *
 * @param a - Start value (returned when t = 0).
 * @param b - End value (returned when t = 1).
 * @param t - Interpolation factor (typically 0-1, but not clamped).
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Round a number to N decimal places.
 *
 * Uses the "multiply, round, divide" approach to avoid floating-point
 * rounding errors for common decimal counts.
 *
 * @param value    - The number to round.
 * @param decimals - Number of decimal places (non-negative integer).
 */
export function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
