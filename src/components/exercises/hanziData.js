// Loads stroke-order data bundled from the locally installed hanzi-writer-data
// package (never a CDN), so writing exercises work even on a slow/offline
// connection. src/content/hanzi-data/ is a curated copy containing only the
// characters vocab.json's writable words actually need - see
// scripts/copy-hanzi-data.mjs. Importing straight from
// node_modules/hanzi-writer-data (~9500 files) would make Vite pre-chunk
// every character in the whole package.
export function loadCharData(char) {
  return import(`../../content/hanzi-data/${char}.json`).then((mod) => mod.default || mod);
}
