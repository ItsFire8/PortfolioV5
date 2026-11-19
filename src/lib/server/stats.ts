import "server-only";
import { sha256 } from "./crypto";
import { all, run } from "./db";

const day = (d = new Date()) => d.toISOString().slice(0, 10);

/**
 * Privacy-friendly analytics: no cookies, no IP storage, no fingerprint
 * that survives the day. A visitor hash = sha256(ip + ua + day + secret)
 * is only used to count unique visitors per day.
 */
export async function recordHit(input: { path: string; referrer: string; ip: string; ua: string; ownHost: string }) {
  const d = day();
  const p = input.path.slice(0, 200) || "/";
  await run(
    "INSERT INTO stats_views (day, path, views) VALUES (?,?,1) ON CONFLICT(day, path) DO UPDATE SET views = views + 1",
    [d, p],
  );
  const hash = sha256(`${input.ip}|${input.ua}|${d}|${process.env.STATS_SALT ?? "homepage"}`).slice(0, 24);
  await run("INSERT OR IGNORE INTO stats_visitors (day, hash) VALUES (?,?)", [d, hash]);
  try {
    const host = input.referrer ? new URL(input.referrer).hostname : "";
    if (host && host !== input.ownHost)
      await run(
        "INSERT INTO stats_referrers (day, host, count) VALUES (?,?,1) ON CONFLICT(day, host) DO UPDATE SET count = count + 1",
        [d, host.slice(0, 120)],
      );
  } catch {
    /* invalid referrer */
  }
}

export async function getStats(days = 30) {
  const since = day(new Date(Date.now() - (days - 1) * 86400000));
  const views = await all<{ day: string; views: number }>(
    "SELECT day, SUM(views) AS views FROM stats_views WHERE day >= ? GROUP BY day ORDER BY day",
    [since],
  );
  const visitors = await all<{ day: string; visitors: number }>(
    "SELECT day, COUNT(*) AS visitors FROM stats_visitors WHERE day >= ? GROUP BY day ORDER BY day",
    [since],
  );
  const referrers = await all<{ host: string; count: number }>(
    "SELECT host, SUM(count) AS count FROM stats_referrers WHERE day >= ? GROUP BY host ORDER BY count DESC LIMIT 10",
    [since],
  );
  const pages = await all<{ path: string; views: number }>(
    "SELECT path, SUM(views) AS views FROM stats_views WHERE day >= ? GROUP BY path ORDER BY views DESC LIMIT 10",
    [since],
  );
  const series: { day: string; views: number; visitors: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = day(new Date(Date.now() - i * 86400000));
    series.push({
      day: d,
      views: Number(views.find((v) => v.day === d)?.views ?? 0),
      visitors: Number(visitors.find((v) => v.day === d)?.visitors ?? 0),
    });
  }
  return {
    series,
    referrers: referrers.map((r) => ({ host: r.host, count: Number(r.count) })),
    pages: pages.map((p) => ({ path: p.path, views: Number(p.views) })),
    totals: {
      views: series.reduce((a, b) => a + b.views, 0),
      visitors: series.reduce((a, b) => a + b.visitors, 0),
    },
  };
}

export async function resetStats() {
  await run("DELETE FROM stats_views");
  await run("DELETE FROM stats_visitors");
  await run("DELETE FROM stats_referrers");
}
