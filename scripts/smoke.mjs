#!/usr/bin/env node
/**
 * Smoke test against a running instance:  BASE_URL=http://localhost:3000 npm test
 * Checks health, security headers and that private data is not reachable anonymously.
 */
const BASE = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
let failed = 0;
const check = (name, ok, extra = "") => {
  console.log(`${ok ? "✓" : "✗"} ${name}${extra ? ` (${extra})` : ""}`);
  if (!ok) failed++;
};

const health = await fetch(`${BASE}/api/health`).then((r) => r.json()).catch(() => null);
check("health endpoint", health?.status === "ok");

const home = await fetch(`${BASE}/`);
check("homepage renders", home.status === 200, String(home.status));
const csp = home.headers.get("content-security-policy") ?? "";
check("CSP with nonce", /script-src[^;]*'nonce-/.test(csp));
check("X-Content-Type-Options", home.headers.get("x-content-type-options") === "nosniff");

check("config API requires login", (await fetch(`${BASE}/api/config`)).status === 401);
check("config write requires login", (await fetch(`${BASE}/api/config`, { method: "PUT", body: "{}" })).status === 401);
check("users API requires login", (await fetch(`${BASE}/api/users`)).status === 401);
check("backups require login", (await fetch(`${BASE}/api/backups`)).status === 401);
const notes = await fetch(`${BASE}/api/widget-data/notes`);
check("private widget data hidden", notes.status === 404, String(notes.status));
const cross = await fetch(`${BASE}/api/auth/login`, { method: "POST", headers: { origin: "https://evil.example", "content-type": "application/json" }, body: "{}" });
check("cross-origin login blocked", cross.status === 403, String(cross.status));
check("manifest", (await fetch(`${BASE}/manifest.webmanifest`)).ok);
check("robots.txt", (await fetch(`${BASE}/robots.txt`)).ok);

console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
