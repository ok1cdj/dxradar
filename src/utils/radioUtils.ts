/**
 * Shared radio helpers for the frontend.
 *
 * These mirror the logic in server.ts so the client and server agree on how
 * frequencies map to bands and how spot callsigns match a watched callsign.
 * Keep this file free of browser-only dependencies so it stays trivially testable.
 */

/** Canonical expedition band list (includes 60m and 6m). */
export const DX_BANDS = [
  '160m', '80m', '60m', '40m', '30m', '20m', '17m', '15m', '12m', '10m', '6m',
] as const;

/**
 * Map a frequency (kHz, as string or number) to a band label.
 * Mirrors getBandFromFreq in server.ts, including the 60m band.
 * If the value is not a number, an already-band-like string is returned as-is.
 */
export function getBandFromFreq(freq: string | number): string {
  const f = typeof freq === 'number' ? freq : parseFloat(freq);

  if (!isNaN(f)) {
    if (f >= 1800 && f <= 2000) return '160m';
    if (f >= 3500 && f <= 4000) return '80m';
    if (f >= 5330 && f <= 5405) return '60m';
    if (f >= 7000 && f <= 7300) return '40m';
    if (f >= 10100 && f <= 10150) return '30m';
    if (f >= 14000 && f <= 14350) return '20m';
    if (f >= 18068 && f <= 18168) return '17m';
    if (f >= 21000 && f <= 21450) return '15m';
    if (f >= 24890 && f <= 24990) return '12m';
    if (f >= 28000 && f <= 29700) return '10m';
    if (f >= 50000 && f <= 54000) return '6m';
  }

  // Not a numeric frequency: pass through (e.g. it's already a band name).
  return String(freq);
}

/**
 * Strict callsign match, mirroring the server (server.ts).
 * A spot's dxCall matches a watched callsign when it is exactly equal, or the
 * watched call is a portable prefix/suffix (e.g. watch "EA5DOM" matches
 * "EA5DOM/P" and "K4/EA5DOM"). Case-insensitive.
 */
export function matchesCallsign(dxCall: string, watch: string): boolean {
  if (!dxCall || !watch) return false;
  const d = dxCall.toUpperCase();
  const w = watch.toUpperCase();
  return d === w || d.startsWith(w + '/') || d.endsWith('/' + w);
}

/** Base amateur callsign: prefix + call-area digit + suffix ending in a letter. */
const BASE_CALLSIGN_RE = /^[A-Z0-9]{1,3}[0-9][A-Z0-9]{0,3}[A-Z]$/;

/**
 * True if `call` is a plausible amateur radio callsign we can hand to ClubLog.
 * Rejects placeholders/partials that some expedition feeds emit (e.g. "JD1...",
 * "JD1/", "..."), which would otherwise fail the ClubLog lookup and waste
 * retries. Accepts real calls including portables (e.g. "K4/EA5DOM", "EA5DOM/P").
 * Mirrors isValidCallsign in server.ts — keep the two in sync.
 */
export function isValidCallsign(call: string): boolean {
  if (!call) return false;
  const c = call.trim().toUpperCase();
  if (!/^[A-Z0-9/]+$/.test(c)) return false; // no dots or other punctuation
  const segments = c.split('/');
  if (segments.length < 1 || segments.length > 3) return false;
  if (segments.some(s => s.length === 0)) return false; // no leading/trailing/double slash
  return segments.some(s => BASE_CALLSIGN_RE.test(s));
}
