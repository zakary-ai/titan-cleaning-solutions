// Compute the "service date" for an 11pm→6am night-shift workflow.
// Uploads done before the cutoff hour (default noon) count toward the
// previous calendar day, keeping a whole overnight shift on a single report.

const DEFAULT_TZ = "America/New_York";
const CUTOFF_HOUR = 12; // noon in property timezone

function partsInTz(tz: string): { year: number; month: number; day: number; hour: number } {
  try {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat("en-CA", {
        timeZone: tz,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        hour12: false,
      })
        .formatToParts(new Date())
        .map((p) => [p.type, p.value]),
    ) as Record<string, string>;
    const hour = parts.hour === "24" ? 0 : parseInt(parts.hour, 10);
    return {
      year: parseInt(parts.year, 10),
      month: parseInt(parts.month, 10),
      day: parseInt(parts.day, 10),
      hour,
    };
  } catch {
    const d = new Date();
    return {
      year: d.getUTCFullYear(),
      month: d.getUTCMonth() + 1,
      day: d.getUTCDate(),
      hour: d.getUTCHours(),
    };
  }
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function addDays(year: number, month: number, day: number, delta: number): string {
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() + delta);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/**
 * Returns the service date (YYYY-MM-DD) for "now" in the given timezone.
 * If local time is before the cutoff hour, returns the previous day so an
 * overnight shift stays on one report.
 */
export function getServiceDateForNow(tz: string = DEFAULT_TZ, cutoffHour: number = CUTOFF_HOUR): string {
  const { year, month, day, hour } = partsInTz(tz);
  return addDays(year, month, day, hour < cutoffHour ? -1 : 0);
}
