#!/usr/bin/env node
// Installs the fixed Projects + Tasks pages (real API instead of mock data).
// Your current files are backed up as <name>.bak-before-fixes. Run from the frontend folder.
const fs = require("fs");
const path = require("path");

const root = process.cwd();
const stage = path.join(root, "_fixes");
const files = ["src/pages/Projects.jsx", "src/pages/Tasks.jsx"];

if (!fs.existsSync(path.join(root, "src", "App.jsx"))) {
  console.error("x Run this from your frontend folder (the one with src/App.jsx).");
  process.exit(1);
}
if (!fs.existsSync(stage)) {
  console.error("x _fixes folder not found. Extract the zip into the frontend folder first.");
  process.exit(1);
}

for (const rel of files) {
  const from = path.join(stage, rel);
  const to = path.join(root, rel);
  if (!fs.existsSync(from)) { console.log(`! ${rel} missing in _fixes - skipped`); continue; }
  if (fs.existsSync(to)) {
    const backup = to + ".bak-before-fixes";
    if (!fs.existsSync(backup)) fs.copyFileSync(to, backup);
  }
  fs.copyFileSync(from, to);
  console.log(`+ ${rel} updated (backup: ${rel}.bak-before-fixes)`);
}

fs.rmSync(stage, { recursive: true, force: true });
console.log("\nDone. Make sure the backend fix is installed too, then: npm run dev");
