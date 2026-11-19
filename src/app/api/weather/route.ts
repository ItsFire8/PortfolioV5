import { cached, safeFetch } from "@/lib/server/cache";
import { handler, HttpError, json } from "@/lib/server/http";
import { resolveWidget } from "@/lib/server/widget-access";

export const dynamic = "force-dynamic";

interface OpenMeteo {
  current?: Record<string, number>;
  daily?: { time: string[]; weather_code: number[]; temperature_2m_max: number[]; temperature_2m_min: number[]; precipitation_probability_max?: number[] };
}

/** Weather via Open-Meteo (free, no API key). Coordinates come from the stored widget config only. */
export const GET = handler(async (req: Request) => {
  const widgetId = new URL(req.url).searchParams.get("widget") ?? "";
  const { widget } = await resolveWidget(widgetId, "weather");
  const s = widget.settings as { latitude?: number; longitude?: number; units?: string; days?: number };
  const lat = Number(s.latitude);
  const lon = Number(s.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || (lat === 0 && lon === 0)) throw new HttpError(400, "No location configured");
  const imperial = s.units === "imperial";
  const days = Math.min(7, Math.max(2, Number(s.days) || 4));
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", lat.toFixed(4));
  url.searchParams.set("longitude", lon.toFixed(4));
  url.searchParams.set("current", "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day");
  url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max");
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", String(days));
  if (imperial) {
    url.searchParams.set("temperature_unit", "fahrenheit");
    url.searchParams.set("wind_speed_unit", "mph");
  }
  try {
    const data = await cached(`weather:${url.search}`, 15 * 60_000, async () => JSON.parse(await safeFetch(url.toString())) as OpenMeteo);
    const c = data.current ?? {};
    return json(
      {
        current: {
          temperature: c.temperature_2m,
          apparent: c.apparent_temperature,
          humidity: c.relative_humidity_2m,
          wind: c.wind_speed_10m,
          code: c.weather_code,
          isDay: c.is_day === 1,
        },
        daily: (data.daily?.time ?? []).map((d, i) => ({
          date: d,
          code: data.daily!.weather_code[i],
          max: data.daily!.temperature_2m_max[i],
          min: data.daily!.temperature_2m_min[i],
          rain: data.daily!.precipitation_probability_max?.[i] ?? null,
        })),
        units: imperial ? { temp: "°F", wind: "mph" } : { temp: "°C", wind: "km/h" },
      },
      { headers: { "cache-control": "private, max-age=300" } },
    );
  } catch (e) {
    throw new HttpError(502, `Weather service unavailable: ${(e as Error).message}`);
  }
});
