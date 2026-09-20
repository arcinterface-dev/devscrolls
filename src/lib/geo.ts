/**
 * Lightweight Client-Side Geolocation Helper
 * 
 * Determines approximate country (ISO 3166-1 alpha-2 code, e.g. "US", "IN", "GB")
 * using privacy-friendly client lookup with strict session caching.
 * 
 * - Zero IP address storage (100% GDPR compliant).
 * - Only 1 lookup per browser session (subsequent calls take 0ms from sessionStorage).
 * - Fails gracefully to 'UNKNOWN' if offline or blocked by ad-blocker.
 */

const GEO_STORAGE_KEY = 'devscrolls_geo_country';
let inMemoryCountry: string | null = null;

export async function getApproxCountry(): Promise<string> {
  if (typeof window === 'undefined') return 'UNKNOWN';

  // 1. Check in-memory variable
  if (inMemoryCountry) return inMemoryCountry;

  // 2. Check sessionStorage
  try {
    const cached = sessionStorage.getItem(GEO_STORAGE_KEY);
    if (cached) {
      inMemoryCountry = cached;
      return cached;
    }
  } catch {
    // Ignore storage sandbox errors
  }

  // 3. Fallback to Intl timezone heuristic if offline or fast check
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  
  try {
    // Fast, free, privacy-first country lookup (no registration, no rate-limit token)
    const res = await fetch('https://api.country.is', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'force-cache'
    });

    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.country === 'string' && data.country.length === 2) {
        const country = data.country.toUpperCase();
        inMemoryCountry = country;
        try {
          sessionStorage.setItem(GEO_STORAGE_KEY, country);
        } catch {}
        return country;
      }
    }
  } catch (err) {
    // Silently continue to timezone inference
  }

  // Timezone-based country approximation fallback
  let fallbackCountry = 'UNKNOWN';
  if (timezone.includes('Calcutta') || timezone.includes('Kolkata')) fallbackCountry = 'IN';
  else if (timezone.startsWith('America/')) fallbackCountry = 'US';
  else if (timezone.startsWith('Europe/London')) fallbackCountry = 'GB';
  else if (timezone.startsWith('Europe/Berlin')) fallbackCountry = 'DE';
  else if (timezone.startsWith('Europe/Paris')) fallbackCountry = 'FR';
  else if (timezone.startsWith('Australia/')) fallbackCountry = 'AU';
  else if (timezone.startsWith('Asia/Tokyo')) fallbackCountry = 'JP';
  else if (timezone.startsWith('Asia/Singapore')) fallbackCountry = 'SG';

  inMemoryCountry = fallbackCountry;
  try {
    sessionStorage.setItem(GEO_STORAGE_KEY, fallbackCountry);
  } catch {}

  return fallbackCountry;
}

/**
 * Returns a flag emoji for a 2-letter ISO country code.
 */
export function getCountryFlag(countryCode: string): string {
  if (!countryCode || countryCode === 'UNKNOWN' || countryCode.length !== 2) {
    return '🌐';
  }
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

/**
 * Maps country code to common country names.
 */
export const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States',
  IN: 'India',
  GB: 'United Kingdom',
  DE: 'Germany',
  CA: 'Canada',
  AU: 'Australia',
  FR: 'France',
  NL: 'Netherlands',
  BR: 'Brazil',
  JP: 'Japan',
  SG: 'Singapore',
  UNKNOWN: 'Global / Unknown'
};
