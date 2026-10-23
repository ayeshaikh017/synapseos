#!/usr/bin/env node
// Wires the analytics feature into src/server.js. Safe to run multiple times.
// Run from the backend folder (the one that contains src/server.js and package.json).
const fs = require("fs");
const path = require("path");

const serverPath = path.join(process.cwd(), "src", "server.js");
if (!fs.existsSync(serverPath)) {
  console.error("x src/server.js not found. cd into your backend folder first, then run this again.");
  process.exit(1);
}

let src = fs.readFileSync(serverPath, "utf8");
if (src.includes("analyticsRoutes")) {
  console.log("= server.js already has analytics wired in - nothing to change.");
  process.exit(0);
}

const eol = src.includes("\r\n") ? "\r\n" : "\n";
const backup = serverPath + ".bak-before-analytics";
fs.writeFileSync(backup, src);

const requireLine = 'const analyticsRoutes = require("./routes/analyticsRoutes");';
const mountLines = [
  'app.use("/api", analyticsRoutes);',
  '// Analytics dashboard UI (static files) -> http://localhost:<PORT>/analytics',
  'app.use("/analytics", express.static(path.join(__dirname, "public", "analytics")));'
].join(eol);

// 1) require lines: after the aiRoutes require (fallback: after the express require)
const aiReq = /^.*require\(["']\.\/routes\/aiRoutes["']\);?[ \t\r]*$/m;
const expressReq = /^.*require\(["']express["']\);?[ \t\r]*$/m;
if (aiReq.test(src)) src = src.replace(aiReq, (m) => m + eol + requireLine);
else if (expressReq.test(src)) src = src.replace(expressReq, (m) => m + eol + requireLine);
else { console.error("x Could not find where to add the require line. Nothing changed."); process.exit(1); }

if (!/const path\s*=\s*require\(["']path["']\)/.test(src)) {
  src = src.replace(expressReq, (m) => m + eol + 'const path = require("path");');
}

// 2) mount: after app.use("/api/ai", ...) (fallback: before the first 404 handler / app.get("/"))
const aiUse = /^.*app\.use\(["']\/api\/ai["'].*\);?[ \t\r]*$/m;
const rootGet = /^app\.get\(["']\/["']/m;
if (aiUse.test(src)) src = src.replace(aiUse, (m) => m + eol + mountLines);
else if (rootGet.test(src)) src = src.replace(rootGet, (m) => mountLines + eol + eol + m);
else { fs.writeFileSync(serverPath, fs.readFileSync(backup)); console.error("x Could not find where to mount routes. Restored original."); process.exit(1); }

fs.writeFileSync(serverPath, src);
console.log("+ server.js updated (backup: src/server.js.bak-before-analytics)");
console.log("");
console.log("Analytics is ready:");
console.log("  API  : GET /api/projects/:projectId/analytics?range=7|30|90|all");
console.log("  UI   : http://localhost:" + (process.env.PORT || 5000) + "/analytics");
