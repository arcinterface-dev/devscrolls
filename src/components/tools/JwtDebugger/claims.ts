/**
 * RFC 7519 Standard JWT Claims Dictionary and Helpers
 */

export interface ClaimInfo {
  name: string;
  description: string;
  isDate?: boolean;
}

export const STANDARD_CLAIMS: Record<string, ClaimInfo> = {
  iss: {
    name: 'Issuer',
    description: 'Identifies the principal that issued the JWT (e.g. https://auth0.com, accounts.google.com)'
  },
  sub: {
    name: 'Subject',
    description: 'Identifies the subject of the JWT (e.g. user ID or service identifier)'
  },
  aud: {
    name: 'Audience',
    description: 'Identifies the recipients that the JWT is intended for (e.g. API client ID)'
  },
  exp: {
    name: 'Expiration Time',
    description: 'Identifies the expiration time on or after which the JWT MUST NOT be accepted',
    isDate: true
  },
  nbf: {
    name: 'Not Before',
    description: 'Identifies the time before which the JWT MUST NOT be accepted for processing',
    isDate: true
  },
  iat: {
    name: 'Issued At',
    description: 'Identifies the time at which the JWT was issued',
    isDate: true
  },
  jti: {
    name: 'JWT ID',
    description: 'Unique identifier for the token, commonly used to prevent token replay attacks'
  }
};

export function formatTimestamp(seconds: number): string {
  try {
    const d = new Date(seconds * 1000);
    return d.toLocaleString('en-US', {
      timeZoneName: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch {
    return String(seconds);
  }
}

export function formatRelativeTime(seconds: number): { text: string; isExpired: boolean } {
  const now = Math.floor(Date.now() / 1000);
  const diff = seconds - now;

  if (diff <= 0) {
    const elapsed = Math.abs(diff);
    if (elapsed < 60) return { text: `Expired ${elapsed}s ago`, isExpired: true };
    if (elapsed < 3600) return { text: `Expired ${Math.floor(elapsed / 60)}m ago`, isExpired: true };
    if (elapsed < 86400) return { text: `Expired ${Math.floor(elapsed / 3600)}h ago`, isExpired: true };
    return { text: `Expired ${Math.floor(elapsed / 86400)}d ago`, isExpired: true };
  } else {
    if (diff < 60) return { text: `Expires in ${diff}s`, isExpired: false };
    if (diff < 3600) return { text: `Expires in ${Math.floor(diff / 60)}m`, isExpired: false };
    if (diff < 86400) return { text: `Expires in ${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`, isExpired: false };
    return { text: `Expires in ${Math.floor(diff / 86400)}d`, isExpired: false };
  }
}

export const SAMPLE_JWT = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfMGExYjJjM2Q0ZTVmNiIsIm5hbWUiOiJBbGV4IFNtaXRoIiwiZW1haWwiOiJhbGV4LnNtaXRoQGRldnNjcm9sbHMuZGV2Iiwicm9sZSI6InNlbmlvcl9lbmdpbmVlciIsImlzcyI6Imh0dHBzOi8vYXV0aC5kZXZzY3JvbGxzLmRldiIsImF1ZCI6ImRldnNjcm9sbHMtYXBpLWdhdGV3YXkiLCJpYXQiOjE3MDQxMTUyMDAsImV4cCI6MTc5ODc2MTYwMCwianRpIjoiOGY0ZDNhOWMtMTIzNC00NWE2LTc4YmMtZGU5MGFiY2RlZjEyIn0.rP7f0i16r56sD7fGkW_yZ754y0d13L8B5R_yD0E8N0M`;

export const SAMPLE_SECRET = 'your-256-bit-secret';
