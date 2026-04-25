/**
 * Precomputes land-clipped polygon coordinates for every 1.0° grid cell in the
 * UK bounding box, then writes the result to src/features/map/data/uk_clipped_cells.json.
 *
 * Re-run whenever you change STEP, LAT_MIN, LAT_MAX, LON_MIN, or LON_MAX:
 *   node scripts/precompute-clipped-cells.js
 *
 * Requires: @turf/intersect, @turf/helpers (already in package.json)
 */

const { intersect } = require('@turf/intersect');
const { polygon: turfPolygon, featureCollection } = require('@turf/helpers');
const LAND = require('../src/features/map/data/ne_110m_land.json');
const fs = require('fs');
const path = require('path');

const STEP = 0.5;
const LAT_MIN = 49.5;
const LAT_MAX = 61.0;
const LON_MIN = -8.0;
const LON_MAX = 2.5;

function cellPolygon(lat, lon, half) {
  return [
    [
      [lon - half, lat - half],
      [lon + half, lat - half],
      [lon + half, lat + half],
      [lon - half, lat + half],
      [lon - half, lat - half],
    ],
  ];
}

function clipCell(lat, lon, half) {
  const cell = turfPolygon(cellPolygon(lat, lon, half));
  const polygons = [];

  for (const f of LAND.features) {
    const b = f.bbox;
    if (
      b &&
      (b[0] > lon + half || b[2] < lon - half || b[1] > lat + half || b[3] < lat - half)
    ) {
      continue;
    }

    let r;
    try {
      r = intersect(featureCollection([cell, f]));
    } catch {
      continue;
    }
    if (!r) continue;

    if (r.geometry.type === 'Polygon') {
      polygons.push(r.geometry.coordinates);
    } else if (r.geometry.type === 'MultiPolygon') {
      for (const coords of r.geometry.coordinates) {
        polygons.push(coords);
      }
    }
  }

  return polygons;
}

const result = {};
for (let lat = LAT_MIN + STEP / 2; lat < LAT_MAX; lat += STEP) {
  for (let lon = LON_MIN + STEP / 2; lon < LON_MAX; lon += STEP) {
    const rlat = +lat.toFixed(2);
    const rlon = +lon.toFixed(2);
    const polys = clipCell(rlat, rlon, STEP / 2);
    if (polys.length > 0) {
      result[`${rlat},${rlon}`] = polys;
    }
  }
}

const outPath = path.join(__dirname, '../src/features/map/data/uk_clipped_cells.json');
fs.writeFileSync(outPath, JSON.stringify(result));
console.log(
  `Written ${Object.keys(result).length} land cells (${(fs.statSync(outPath).size / 1024).toFixed(1)} KB) → ${outPath}`,
);
