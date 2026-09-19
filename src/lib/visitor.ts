/**
 * Visitor Identity Helper (Client-Side Only)
 * 
 * Provides an anonymous, persistent UUID stored in localStorage for counting claps
 * and deduplicating anonymous actions without requiring login or cookies.
 * 100% GDPR compliant (no PII or IP stored).
 */

const VISITOR_KEY = 'devscrolls_visitor_id';

export function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') return '';

  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : 'v_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return 'fallback_visitor';
  }
}

export function hasViewedInSession(slug: string): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return Boolean(sessionStorage.getItem(`devscrolls_view_${slug}`));
  } catch {
    return false;
  }
}

export function markViewedInSession(slug: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(`devscrolls_view_${slug}`, 'true');
  } catch {
    // Ignore storage quota errors
  }
}
