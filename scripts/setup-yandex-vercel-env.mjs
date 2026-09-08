#!/usr/bin/env node
/**
 * Sync Yandex Maps env vars to Vercel (Production, Preview, Development).
 * Geocoder and GeoSuggest are intentionally stored as server-side variables;
 * only the JavaScript Maps SDK key is exposed to the browser.
 *
 * Usage:
 *   YANDEX_API_KEY=your-key npm run maps:env
 *
 * Or pass a dedicated maps key:
 *   NEXT_PUBLIC_YANDEX_MAPS_API_KEY=your-key npm run maps:env
 */
import { spawnSync } from "node:child_process";

const environments = ["production", "preview", "development"];

const mapsApiKey =
  process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY?.trim() ||
  process.env.YANDEX_MAPS_API_KEY?.trim() ||
  process.env.YANDEX_API_KEY?.trim() ||
  process.env.NEXT_PUBLIC_MAP_API_KEY?.trim();

const geocoderApiKey =
  process.env.YANDEX_GEOCODER_API_KEY?.trim() ||
  process.env.NEXT_PUBLIC_YANDEX_GEOCODER_API_KEY?.trim() ||
  process.env.YANDEX_API_KEY?.trim() ||
  mapsApiKey;

const geosuggestApiKey =
  process.env.YANDEX_GEOSUGGEST_API_KEY?.trim() ||
  process.env.NEXT_PUBLIC_YANDEX_GEOSUGGEST_API_KEY?.trim() ||
  process.env.YANDEX_API_KEY?.trim() ||
  mapsApiKey;

if (!mapsApiKey || !geocoderApiKey || !geosuggestApiKey) {
  console.error(
    "Missing Yandex API key. Set NEXT_PUBLIC_YANDEX_MAPS_API_KEY, YANDEX_GEOCODER_API_KEY, YANDEX_GEOSUGGEST_API_KEY, or shared YANDEX_API_KEY.",
  );
  process.exit(1);
}

const vars = [
  ["NEXT_PUBLIC_MAP_PROVIDER", "yandex"],
  ["NEXT_PUBLIC_YANDEX_MAPS_API_KEY", mapsApiKey],
  ["YANDEX_GEOCODER_API_KEY", geocoderApiKey],
  ["YANDEX_GEOSUGGEST_API_KEY", geosuggestApiKey],
];

function addEnv(name, value, environment) {
  const result = spawnSync(
    "vercel",
    ["env", "add", name, environment, "--force"],
    {
      input: value,
      encoding: "utf8",
      stdio: ["pipe", "inherit", "inherit"],
    },
  );

  if (result.status !== 0) {
    console.error(`Failed to set ${name} for ${environment}`);
    process.exit(result.status ?? 1);
  }

  console.log(`✓ ${name} → ${environment}`);
}

for (const environment of environments) {
  console.log(`\n→ ${environment}`);
  for (const [name, value] of vars) {
    addEnv(name, value, environment);
  }
}

console.log("\nDone. Redeploy production to apply: vercel --prod");
