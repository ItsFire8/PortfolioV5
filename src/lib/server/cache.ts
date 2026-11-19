import "server-only";
import { lookup } from "node:dns/promises";
import net from "node:net";
import { now, one, run } from "./db";

export async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const row = await one<{ value: string; expires_at: number }>("SELECT value, expires_at FROM cache WHERE key = ?", [key]);
  if (row && Number(row.expires_at) > now()) return JSON.parse(row.value) as T;
  try {
    const value = await load();
    await run("INSERT OR REPLACE INTO cache (key, value, expires_at) VALUES (?,?,?)", [key, JSON.stringify(value), now() + ttlMs]);
    return value;
  } catch (e) {
    if (row) return JSON.parse(row.value) as T; // serve stale on upstream failure
    throw e;
  }
}

/** fetch() with timeout, size limit and SSRF-checked redirects for optional outbound integrations. */
export async function safeFetch(url: string, opts: { timeoutMs?: number; maxBytes?: number; accept?: string } = {}): Promise<string> {
  let u = new URL(url);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 8000);
  try {
    for (let hop = 0; hop < 4; hop++) {
      if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error("Unsupported protocol");
      await assertPublicHost(u.hostname);
      const res = await fetch(u, {
        signal: ctrl.signal,
        redirect: "manual",
        headers: { "user-agent": "SelfHostedHomepage/1.0", accept: opts.accept ?? "*/*" },
      });
      if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
        u = new URL(res.headers.get("location")!, u);
        continue;
      }
      if (!res.ok) throw new Error(`Upstream ${res.status}`);
      const buf = await res.arrayBuffer();
      if (buf.byteLength > (opts.maxBytes ?? 2_000_000)) throw new Error("Upstream response too large");
      return new TextDecoder().decode(buf);
    }
    throw new Error("Too many redirects");
  } finally {
    clearTimeout(timer);
  }
}

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
  }
  const v = ip.toLowerCase();
  return v === "::1" || v === "::" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80") || v.startsWith("::ffff:127.") || v.startsWith("::ffff:10.") || v.startsWith("::ffff:192.168.");
}

/**
 * SSRF guard: outbound requests may only target public addresses unless the
 * operator explicitly allows private networks (e.g. homelab feeds).
 */
async function assertPublicHost(hostname: string) {
  if (process.env.ALLOW_PRIVATE_FETCH === "true") return;
  const h = hostname.replace(/^\[|\]$/g, "");
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".internal")) throw new Error("Private host not allowed");
  const addrs = net.isIP(h) ? [{ address: h }] : await lookup(h, { all: true });
  if (addrs.some((a) => isPrivateIp(a.address))) throw new Error("Private host not allowed");
}
