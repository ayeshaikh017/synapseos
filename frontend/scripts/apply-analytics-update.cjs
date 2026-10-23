#!/usr/bin/env node
// Wires the Analytics page into the frontend. Safe to run multiple times.
// Run from the frontend folder (the one with package.json and src/App.jsx).
const fs = require("fs");
const path = require("path");

const root = process.cwd();
const file = (p) => path.join(root, p);
if (!fs.existsSync(file("src/App.jsx"))) {
  console.error("x src/App.jsx not found. cd into your frontend folder first, then run this again.");
  process.exit(1);
}

let failed = 0;

// patch(): reads file, applies fn(src) -> newSrc|null (null = could not patch), keeps a backup once.
const patch = (rel, marker, fn) => {
  const p = file(rel);
  if (!fs.existsSync(p)) { console.log(`! ${rel} not found - skipped`); failed++; return; }
  const src = fs.readFileSync(p, "utf8");
  if (src.includes(marker)) { console.log(`= ${rel} already updated`); return; }
  const eol = src.includes("\r\n") ? "\r\n" : "\n";
  const out = fn(src, eol);
  if (!out) { console.log(`! ${rel}: could not find the spot to patch - see manual step in docs/ANALYTICS_FRONTEND.md`); failed++; return; }
  fs.writeFileSync(p + ".bak-before-analytics", src);
  fs.writeFileSync(p, out);
  console.log(`+ ${rel} updated (backup: ${rel}.bak-before-analytics)`);
};

// 1) App.jsx: import + route
patch("src/App.jsx", "pages/Analytics", (src, eol) => {
  const imp = /^import AI from ["']\.\/pages\/AI["'];?[ \t\r]*$/m;
  const route = /^([ \t]*)<Route[ \t\r\n]+path="\/settings"/m;
  if (!imp.test(src) || !route.test(src)) return null;
  src = src.replace(imp, (m) => m + eol + 'import Analytics from "./pages/Analytics";');
  return src.replace(route, (m, indent) =>
    [
      `${indent}<Route`,
      `${indent}  path="/analytics"`,
      `${indent}  element={`,
      `${indent}    <AppLayout>`,
      `${indent}      <Analytics />`,
      `${indent}    </AppLayout>`,
      `${indent}  }`,
      `${indent}/>`,
      "",
      m
    ].join(eol)
  );
});

// 2) Sidebar: icon import + nav item under Workspace
patch("src/layouts/AppLayout.jsx", "ChartColumn", (src, eol) => {
  const icon = /^([ \t]*)Layers3,[ \t\r]*$/m;
  const item = /(label:\s*"Sprints",\s*path:\s*"\/sprints",\s*icon:\s*Layers3,\s*\},)/;
  if (!icon.test(src) || !item.test(src)) return null;
  src = src.replace(icon, (m, indent) => m + eol + `${indent}ChartColumn,`);
  return src.replace(item, (m) =>
    m + eol + ["  {", '    label: "Analytics",', '    path: "/analytics",', "    icon: ChartColumn,", "  },"].join(eol)
  );
});

// 3) Project workspace tabs: Analytics tab
patch("src/pages/ProjectWorkspace.jsx", "/analytics?project=", (src, eol) => {
  const gh = /^([ \t]*)<Link[ \t\r\n]+to="\/github"/m;
  if (!gh.test(src)) return null;
  return src.replace(gh, (m, i) =>
    [
      `${i}<Link`,
      `${i}  to={\`/analytics?project=\${projectId}\`}`,
      `${i}  className="pb-3 text-sm font-medium text-zinc-500 transition hover:text-zinc-900"`,
      `${i}>`,
      `${i}  Analytics`,
      `${i}</Link>`,
      "",
      m
    ].join(eol)
  );
});

console.log("");
if (failed) {
  console.log(`Done with ${failed} item(s) needing a manual step (see above). The new page itself is installed.`);
  process.exit(0);
}
console.log("Analytics is ready: run  npm run dev  and open  http://localhost:5173/analytics");
