/**
 * Simplifies lat/lon to an ≈11km grid cell identifier.
 * Rounds to 1 decimal place — no external library needed.
 */
export function latLonToCell(lat: number, lon: number): string {
  return `${lat.toFixed(1)}_${lon.toFixed(1)}`;
}
