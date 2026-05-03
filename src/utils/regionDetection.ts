/** Returns true if coordinates fall within Europe (Open-Meteo pollen coverage area). */
export function isEurope(lat: number, lon: number): boolean {
  return lat >= 34 && lat <= 72 && lon >= -25 && lon <= 45;
}
