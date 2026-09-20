/**
 * DevScrolls Tools Analytics Helper
 * 
 * Non-blocking, client-side event tracking powered by Supabase.
 * - Fire-and-forget: uses requestIdleCallback so it never blocks UI operations.
 * - Session-level page view deduplication via sessionStorage.
 * - Throttling: prevents excessive rapid calls (max 1 action event per 5 seconds per tool).
 * - Safe fallback: completely silent if Supabase is offline or not configured.
 */

import { supabase, isSupabaseConfigured, isLocalhost } from './supabase';
import { getOrCreateVisitorId } from './visitor';
import { getApproxCountry } from './geo';

// In-memory throttling map to prevent double-firing in single session
const lastActionTimes: Record<string, number> = {};
const THROTTLE_MS = 5000; // 5 seconds throttle per tool

export interface TrackMetadata {
  char_count?: number;
  secrets_found?: Record<string, number>;
  algorithm?: string;
  valid?: boolean;
  format_type?: string;
  country?: string;
  [key: string]: unknown;
}

/**
 * Track an arbitrary tool event in a non-blocking background queue.
 */
export function trackToolEvent(
  toolSlug: string,
  eventType: 'page_view' | 'action',
  eventAction?: string,
  metadata: TrackMetadata = {}
): void {
  if (typeof window === 'undefined') return;

  // Never update Supabase on localhost during local development
  if (isLocalhost()) {
    console.debug(`[DevScrolls Analytics (Localhost)] Skipped event: ${toolSlug} - ${eventType} - ${eventAction || 'view'}`);
    return;
  }

  // Client-side action throttle
  if (eventType === 'action') {
    const key = `${toolSlug}:${eventAction || 'default'}`;
    const now = Date.now();
    const lastTime = lastActionTimes[key] || 0;
    if (now - lastTime < THROTTLE_MS) {
      return; // Throttled
    }
    lastActionTimes[key] = now;
  }

  const runTracking = async () => {
    try {
      if (!isSupabaseConfigured) return;
      const visitorId = getOrCreateVisitorId();
      if (!visitorId) return;

      const country = await getApproxCountry();
      const enrichedMetadata = {
        ...metadata,
        country
      };

      await supabase.rpc('track_tool_event', {
        p_tool_slug: toolSlug,
        p_event_type: eventType,
        p_event_action: eventAction || null,
        p_visitor_id: visitorId,
        p_metadata: enrichedMetadata,
        p_country: country
      });
    } catch (err) {
      // Fire-and-forget: silently ignore telemetry errors
      console.debug('[DevScrolls Analytics] Telemetry silently dropped:', err);
    }
  };

  // Schedule during browser idle time so main UI thread stays 60fps
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => {
      void runTracking();
    }, { timeout: 2000 });
  } else {
    setTimeout(() => {
      void runTracking();
    }, 200);
  }
}

/**
 * Record a page view for a tool, strictly once per browser session.
 */
export function trackToolPageView(toolSlug: string): void {
  if (typeof window === 'undefined') return;

  try {
    const sessionKey = `devscrolls_tool_view_${toolSlug}`;
    if (sessionStorage.getItem(sessionKey)) {
      return; // Already recorded in this session
    }
    sessionStorage.setItem(sessionKey, '1');
    trackToolEvent(toolSlug, 'page_view');
  } catch {
    // If sessionStorage quota exceeded or blocked by strict sandbox
    trackToolEvent(toolSlug, 'page_view');
  }
}
