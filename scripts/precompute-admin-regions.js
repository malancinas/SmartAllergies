/**
 * Builds src/features/map/data/admin_regions.json
 *
 * Priority layers (highest detail wins):
 *   1. UK Local Authority Districts  — 380 regions from martinjc/UK-GeoJSON
 *   2. Large-country admin-1         — USA / Russia / Canada / etc. (admin1_large_countries.json)
 *   3. Country outlines              — world-atlas global fallback
 *
 * Re-run: node scripts/precompute-admin-regions.js
 * Re-run after changing bounds: also re-run precompute-clipped-cells.js
 */

const fs = require('fs');
const path = require('path');
const topo = require('topojson-client');
const simplify = require('@turf/simplify').default;
const centroid = require('@turf/centroid').default;
const bbox = require('@turf/bbox').default;
const calcArea = require('@turf/area').default;

const OUT_PATH = path.join(__dirname, '../src/features/map/data/admin_regions.json');
const WORLD_PATH = 'c:/Users/malan/AppData/Local/Temp/geodata/world_countries.json';
const UK_TOPO_PATH = 'c:/Users/malan/AppData/Local/Temp/geodata/uk_topo_lad.json';
const LARGE_CC_PATH = path.join(__dirname, '../src/features/map/data/admin1_large_countries.json');

const SKIP_COUNTRY_NAMES = new Set([
  'United Kingdom', 'Australia', 'Brazil', 'Canada', 'China',
  'Indonesia', 'India', 'Russia', 'United States of America', 'South Africa',
]);

const ID_TO_A3 = {
  4:'AFG',8:'ALB',12:'DZA',24:'AGO',32:'ARG',36:'AUS',40:'AUT',50:'BGD',56:'BEL',
  68:'BOL',76:'BRA',100:'BGR',116:'KHM',120:'CMR',124:'CAN',152:'CHL',156:'CHN',
  170:'COL',180:'COD',192:'CUB',196:'CYP',203:'CZE',208:'DNK',218:'ECU',818:'EGY',
  231:'ETH',246:'FIN',250:'FRA',276:'DEU',288:'GHA',300:'GRC',320:'GTM',332:'HTI',
  348:'HUN',356:'IND',360:'IDN',364:'IRN',368:'IRQ',372:'IRL',376:'ISR',380:'ITA',
  388:'JAM',392:'JPN',400:'JOR',404:'KEN',410:'KOR',408:'PRK',414:'KWT',418:'LAO',
  422:'LBN',430:'LBR',434:'LBY',450:'MDG',484:'MEX',504:'MAR',508:'MOZ',516:'NAM',
  524:'NPL',528:'NLD',554:'NZL',558:'NIC',566:'NGA',578:'NOR',586:'PAK',591:'PAN',
  598:'PNG',604:'PER',608:'PHL',616:'POL',620:'PRT',634:'QAT',642:'ROU',643:'RUS',
  682:'SAU',706:'SOM',710:'ZAF',724:'ESP',144:'LKA',729:'SDN',752:'SWE',756:'CHE',
  760:'SYR',158:'TWN',764:'THA',792:'TUR',800:'UGA',804:'UKR',784:'ARE',826:'GBR',
  840:'USA',858:'URY',860:'UZB',862:'VEN',704:'VNM',887:'YEM',894:'ZMB',716:'ZWE',
};

// Only polygon parts >= this area are kept (filters out tiny islands/rocks)
const MIN_PART_M2 = 2e6; // 2 km²
const MAX_PARTS = 6;

// Simplify a single Polygon feature; returns null if result is degenerate.
function trySimplify(polyFeature, tolerance) {
  try {
    const s = simplify(polyFeature, { tolerance, highQuality: false, mutate: false });
    if (s.geometry.type === 'Polygon' && s.geometry.coordinates[0].length >= 4) return s;
  } catch {}
  return null;
}

// Returns simplified Polygon features (one per significant part) from any feature.
function processFeature(feature, tolerance) {
  const geom = feature.geometry;
  if (!geom) return [];

  const rawParts =
    geom.type === 'Polygon' ? [{ type: 'Feature', geometry: geom, properties: {} }]
    : geom.type === 'MultiPolygon' ? geom.coordinates.map((c) => ({
        type: 'Feature', geometry: { type: 'Polygon', coordinates: c }, properties: {},
      }))
    : [];

  return rawParts
    .filter((p) => calcArea(p) >= MIN_PART_M2)
    .sort((a, b) => calcArea(b) - calcArea(a))
    .slice(0, MAX_PARTS)
    .map((p) => trySimplify(p, tolerance) ?? p)  // keep original if simplify fails
    .filter((p) => p.geometry.coordinates[0].length >= 4)
    .map((p) => ({ ...feature, geometry: p.geometry }));
}

function addMeta(feature, id, name, countryCode) {
  let c, b;
  try { c = centroid(feature); b = bbox(feature); } catch { return null; }
  return {
    type: 'Feature',
    properties: {
      id, name, country_code: countryCode,
      centroid: [+c.geometry.coordinates[0].toFixed(4), +c.geometry.coordinates[1].toFixed(4)],
      bbox: b.map((v) => +v.toFixed(4)),
    },
    geometry: feature.geometry,
  };
}

async function run() {
  const out = { type: 'FeatureCollection', features: [] };
  let idx = 0;

  // ── 1. UK Local Authority Districts ──────────────────────────────────────────
  console.log('Processing UK LADs…');
  const ukTopo = JSON.parse(fs.readFileSync(UK_TOPO_PATH, 'utf8'));
  const ukKey = Object.keys(ukTopo.objects)[0];
  const ukRaw = topo.feature(ukTopo, ukTopo.objects[ukKey]);

  for (const feature of ukRaw.features) {
    const p = feature.properties ?? {};
    const name = p.LAD13NM ?? p.lad13nm ?? `UK-${idx}`;
    const code = p.LAD13CD ?? p.lad13cd ?? `GBR-${idx}`;

    for (const part of processFeature(feature, 0.01)) {
      const withMeta = addMeta(part, `GBR-${code}`, name, 'GBR');
      if (withMeta) { out.features.push(withMeta); idx++; }
    }
  }
  console.log(`  → ${out.features.length} UK LAD features`);

  // ── 2. Large-country admin-1 ─────────────────────────────────────────────────
  if (fs.existsSync(LARGE_CC_PATH)) {
    console.log('Processing large-country admin-1…');
    const large = JSON.parse(fs.readFileSync(LARGE_CC_PATH, 'utf8'));
    const before = out.features.length;
    for (const feature of large.features) {
      const p = feature.properties ?? {};
      const withMeta = addMeta(feature, p.id ?? `L-${idx}`, p.name ?? '', p.country_code ?? '');
      if (withMeta) { out.features.push(withMeta); idx++; }
    }
    console.log(`  → ${out.features.length - before} large-country features`);
  }

  // ── 3. World country outlines (global fallback) ───────────────────────────────
  console.log('Processing world country outlines…');
  const worldTopo = JSON.parse(fs.readFileSync(WORLD_PATH, 'utf8'));
  const worldGeoJson = topo.feature(worldTopo, worldTopo.objects.countries);
  const before3 = out.features.length;

  for (const feature of worldGeoJson.features) {
    const name = feature.properties?.name ?? '';
    if (SKIP_COUNTRY_NAMES.has(name)) continue;
    const cc = ID_TO_A3[feature.id] ?? `N${feature.id}`;

    for (const part of processFeature(feature, 0.02)) {
      const withMeta = addMeta(part, `CTRY-${cc}-${idx}`, name, cc);
      if (withMeta) { out.features.push(withMeta); idx++; }
    }
  }
  console.log(`  → ${out.features.length - before3} country-outline features`);

  fs.writeFileSync(OUT_PATH, JSON.stringify(out));
  const kb = (fs.statSync(OUT_PATH).size / 1024).toFixed(1);
  console.log(`\nWritten ${out.features.length} features (${kb} KB) → ${OUT_PATH}`);
}

run().catch((e) => { console.error(e); process.exit(1); });
