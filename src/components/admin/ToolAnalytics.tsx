import React, { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { getCountryFlag, COUNTRY_NAMES } from '../../lib/geo';
import type { User } from '@supabase/supabase-js';
import styles from './ToolAnalytics.module.css';

interface ToolStatItem {
  tool_slug: string;
  total_views: number;
  total_actions: number;
  unique_visitors: number;
  country_actions?: Record<string, number>;
  last_used_at: string;
}

interface PostStatItem {
  post_slug: string;
  views_count: number;
  claps_count: number;
  country_views?: Record<string, number>;
}

interface SecretFrequency {
  name: string;
  count: number;
}


export default function ToolAnalytics() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  
  const [toolStats, setToolStats] = useState<ToolStatItem[]>([]);
  const [postStats, setPostStats] = useState<PostStatItem[]>([]);
  const [totalComments, setTotalComments] = useState(0);
  const [secretBreakdown, setSecretBreakdown] = useState<SecretFrequency[]>([]);
  const [topActions, setTopActions] = useState<{ action: string; count: number }[]>([]);

  // Admin email list from environment
  const adminEmailsEnv = (import.meta.env.PUBLIC_ADMIN_EMAIL || '')
    .split(',')
    .map((e: string) => e.trim().toLowerCase())
    .filter(Boolean);

  // Check auth session
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthLoading(false);
      return;
    }

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch (err) {
        console.error('Failed to get auth session:', err);
      } finally {
        setAuthLoading(false);
      }
    };

    void checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const userEmail = user?.email?.toLowerCase() || '';
  const isAuthorized = !adminEmailsEnv.length || (userEmail && adminEmailsEnv.includes(userEmail));

  // Load analytics data once authorized
  const fetchDashboardData = useCallback(async () => {
    if (!isSupabaseConfigured || !user || !isAuthorized) return;
    setDataLoading(true);

    try {
      // 1. Fetch tool lifetime stats
      const { data: toolsData } = await supabase
        .from('tool_stats')
        .select('*')
        .order('total_actions', { ascending: false });

      if (toolsData) {
        setToolStats(toolsData as ToolStatItem[]);
      }

      // 2. Fetch post stats (blog articles)
      const { data: postsData } = await supabase
        .from('post_stats')
        .select('*')
        .order('views_count', { ascending: false });

      if (postsData) {
        setPostStats(postsData as PostStatItem[]);
      }

      // 3. Fetch total comments count
      const { count: commentsCount } = await supabase
        .from('post_comments')
        .select('*', { count: 'exact', head: true });

      setTotalComments(commentsCount || 0);

      // 4. Fetch recent tool events to extract secret telemetry and top actions
      const { data: eventsData } = await supabase
        .from('tool_events')
        .select('event_action, metadata')
        .limit(300);

      if (eventsData) {
        const secretMap: Record<string, number> = {};
        const actionMap: Record<string, number> = {};

        for (const evt of eventsData) {
          if (evt.event_action) {
            actionMap[evt.event_action] = (actionMap[evt.event_action] || 0) + 1;
          }

          const secrets = (evt.metadata as any)?.secrets_found;
          if (secrets && typeof secrets === 'object') {
            for (const [secKey, count] of Object.entries(secrets)) {
              secretMap[secKey] = (secretMap[secKey] || 0) + Number(count);
            }
          }
        }

        const sortedSecrets = Object.entries(secretMap)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count);

        const sortedActions = Object.entries(actionMap)
          .map(([action, count]) => ({ action, count }))
          .sort((a, b) => b.count - a.count);

        setSecretBreakdown(sortedSecrets);
        setTopActions(sortedActions);
      }
    } catch (err) {
      console.error('Failed to load analytics dashboard data:', err);
    } finally {
      setDataLoading(false);
    }
  }, [user, isAuthorized]);

  useEffect(() => {
    if (user && isAuthorized) {
      void fetchDashboardData();
    }
  }, [user, isAuthorized, fetchDashboardData]);

  // Auth Handlers
  const handleSignIn = async (provider: 'github' | 'google') => {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('auth_redirect_target', '/admin/analytics');
      }
      await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/admin/analytics` : undefined
        }
      });
    } catch (err) {
      console.error('OAuth sign in error:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // 1. Loading screen
  if (authLoading) {
    return (
      <div class={styles.container}>
        <div class={styles.authGate}>
          <div class={styles.authIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
          </div>
          <h2 class={styles.authTitle}>Loading Analytics...</h2>
          <p class={styles.authSubtitle}>Checking cryptographic authorization session</p>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated Screen (OAuth Gate)
  if (!user) {
    return (
      <div class={styles.container}>
        <div class={styles.authGate}>
          <div class={styles.authIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h2 class={styles.authTitle}>Private Analytics Portal</h2>
          <p class={styles.authSubtitle}>
            This internal intelligence dashboard is strictly restricted to site administrators. Please authenticate with your admin account.
          </p>
          <div class={styles.authButtons}>
            <button 
              type="button" 
              class={styles.btnOAuth} 
              onClick={() => handleSignIn('github')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              Sign in with GitHub
            </button>
            <button 
              type="button" 
              class={styles.btnOAuth} 
              onClick={() => handleSignIn('google')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.14z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.26 21.36 7.34 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.97 0 12s.46 3.84 1.26 5.42l4.02-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              Sign in with Google
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Unauthorized Screen (Email not in allowlist)
  if (!isAuthorized) {
    return (
      <div class={styles.container}>
        <div class={styles.authGate}>
          <div class={styles.authIcon} style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <h2 class={styles.authTitle}>Access Restricted</h2>
          <p class={styles.authSubtitle}>
            Logged in as <strong>{user.email}</strong>.<br />
            This account is not on the admin allowlist. To grant access, add this email to <code>PUBLIC_ADMIN_EMAIL</code> in your environment.
          </p>
          <button 
            type="button" 
            class={`${styles.btnOAuth} ${styles.btnDanger}`} 
            onClick={handleSignOut}
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // Aggregate Metrics Calculations
  const totalBlogViews = postStats.reduce((sum, p) => sum + (p.views_count || 0), 0);
  const totalBlogClaps = postStats.reduce((sum, p) => sum + (p.claps_count || 0), 0);
  const totalToolActions = toolStats.reduce((sum, t) => sum + (t.total_actions || 0), 0);
  const totalToolViews = toolStats.reduce((sum, t) => sum + (t.total_views || 0), 0);
  const totalUniqueVisitors = toolStats.reduce((sum, t) => sum + (t.unique_visitors || 0), 0);
  const clapToViewRatio = totalBlogViews > 0 ? ((totalBlogClaps / totalBlogViews) * 100).toFixed(1) : '0';

  const maxToolActions = Math.max(...toolStats.map(t => t.total_actions || 0), 1);

  // Geographic Aggregations (from JSONB columns in post_stats & tool_stats)
  const geoTotals: Record<string, number> = {};
  for (const post of postStats) {
    if (post.country_views && typeof post.country_views === 'object') {
      for (const [c, cnt] of Object.entries(post.country_views)) {
        geoTotals[c] = (geoTotals[c] || 0) + Number(cnt);
      }
    }
  }
  for (const tool of toolStats) {
    if (tool.country_actions && typeof tool.country_actions === 'object') {
      for (const [c, cnt] of Object.entries(tool.country_actions)) {
        geoTotals[c] = (geoTotals[c] || 0) + Number(cnt);
      }
    }
  }

  const totalGeoImpressions = Object.values(geoTotals).reduce((a, b) => a + b, 0);
  const sortedGeos = Object.entries(geoTotals)
    .map(([code, count]) => ({
      code,
      name: COUNTRY_NAMES[code] || code,
      flag: getCountryFlag(code),
      count,
      percent: totalGeoImpressions > 0 ? ((count / totalGeoImpressions) * 100).toFixed(1) : '0'
    }))
    .sort((a, b) => b.count - a.count);

  const tier1Codes = new Set(['US', 'GB', 'CA', 'DE', 'AU']);
  const tier1Count = sortedGeos
    .filter(g => tier1Codes.has(g.code))
    .reduce((sum, g) => sum + g.count, 0);
  const tier1Percent = totalGeoImpressions > 0 
    ? ((tier1Count / totalGeoImpressions) * 100).toFixed(1) 
    : '0';


  return (
    <div class={styles.container}>
      {/* Dashboard Top Header */}
      <header class={styles.header}>
        <div class={styles.titleArea}>
          <h1 class={styles.pageTitle}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" color="var(--accent-brand)">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
            DevScrolls Executive Analytics
            <span class={styles.badgePrivate}>Internal Only</span>
          </h1>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Real-time tool executions, blog traffic, and monetization readiness metrics.
          </span>
        </div>

        <div class={styles.headerMeta}>
          <span class={styles.userBadge}>
            Admin: <strong>{user.email}</strong>
          </span>
          <button 
            type="button" 
            class={styles.btnRefresh} 
            onClick={fetchDashboardData}
            disabled={dataLoading}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            {dataLoading ? 'Updating...' : 'Refresh'}
          </button>
          <button 
            type="button" 
            class={styles.btnRefresh} 
            onClick={handleSignOut}
            title="Sign out of admin session"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* KPI Cards Row */}
      <div class={styles.kpiGrid}>
        <div class={styles.kpiCard}>
          <span class={styles.kpiLabel}>Total Blog Reads</span>
          <span class={styles.kpiValue}>{totalBlogViews.toLocaleString()}</span>
          <span class={styles.kpiSubtext}>Unique post impressions</span>
        </div>

        <div class={styles.kpiCard}>
          <span class={styles.kpiLabel}>Reader Appreciation</span>
          <span class={styles.kpiValue}>{totalBlogClaps.toLocaleString()}</span>
          <span class={styles.kpiSubtext}>Clap ratio: {clapToViewRatio}%</span>
        </div>

        <div class={styles.kpiCard}>
          <span class={styles.kpiLabel}>Tool Executions</span>
          <span class={styles.kpiValue} style={{ color: 'var(--accent-brand)' }}>
            {totalToolActions.toLocaleString()}
          </span>
          <span class={styles.kpiSubtext}>Across {toolStats.length} developer tools</span>
        </div>

        <div class={styles.kpiCard}>
          <span class={styles.kpiLabel}>Community Discussions</span>
          <span class={styles.kpiValue}>{totalComments.toLocaleString()}</span>
          <span class={styles.kpiSubtext}>Verified reader comments</span>
        </div>
      </div>

      {/* Two Column Grid */}
      <div class={styles.sectionsGrid}>
        {/* Left Column: Tool Velocity Breakdown */}
        <section class={styles.dashboardSection}>
          <h2 class={styles.sectionTitle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            Tool Velocity & Adoption
          </h2>

          <div class={styles.toolVelocityList}>
            {toolStats.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                No tool telemetry recorded yet. Visit the tools to trigger initial events.
              </p>
            ) : (
              toolStats.map(tool => {
                const percentage = Math.round(((tool.total_actions || 0) / maxToolActions) * 100);
                return (
                  <div key={tool.tool_slug} class={styles.toolVelocityItem}>
                    <div class={styles.toolVelocityHeader}>
                      <span>{tool.tool_slug.replace('-', ' ').toUpperCase()}</span>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>
                        <strong>{tool.total_actions}</strong> runs • {tool.total_views} views
                      </span>
                    </div>
                    <div class={styles.toolVelocityBarTrack}>
                      <div 
                        class={styles.toolVelocityBarFill} 
                        style={{ width: `${Math.max(percentage, 8)}%` }} 
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {topActions.length > 0 && (
            <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                High-Intent Actions Triggered:
              </span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                {topActions.map(act => (
                  <span key={act.action} class={styles.secretChip}>
                    {act.action}: <strong>{act.count}</strong>
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Right Column: Secrets Leakage Threat Intelligence */}
        <section class={styles.dashboardSection}>
          <h2 class={styles.sectionTitle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Leaked Secret Trends (PII Scrubber)
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 16px' }}>
            Aggregated distribution of sensitive data types scrubbed by developers before AI prompts:
          </p>

          {secretBreakdown.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              No secrets scrubbed yet. As users scrub logs on <code>/tools/pii-scrubber/</code>, sanitized threat metrics appear here.
            </p>
          ) : (
            <div class={styles.secretTagsWrap}>
              {secretBreakdown.map(sec => (
                <div key={sec.name} class={styles.secretChip}>
                  <span>{sec.name.replace(/_/g, ' ').toUpperCase()}</span>
                  <span class={styles.secretChipCount}>{sec.count}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Reader & Tool Geographies Section */}
      <section class={styles.dashboardSection} style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          <h2 class={styles.sectionTitle} style={{ margin: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
            Top Reader & Tool Geographies
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Tier 1 High-CPM Traffic (US, GB, CA, DE, AU): <strong style={{ color: '#10b981' }}>{tier1Percent}%</strong>
          </span>
        </div>

        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 16px' }}>
          Approximate country distribution aggregated from article reads (<code>country_views</code>) and tool executions (<code>country_actions</code>):
        </p>

        {sortedGeos.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            No geographic telemetry recorded yet. As readers view articles or use tools, country breakdowns will populate automatically.
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {sortedGeos.map(geo => {
              const isTier1 = tier1Codes.has(geo.code);
              return (
                <div 
                  key={geo.code} 
                  style={{ 
                    padding: '12px 14px', 
                    background: 'var(--surface-sunken)', 
                    border: '1px solid var(--border-subtle)', 
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: 600 }}>
                    <span>
                      {geo.flag} {geo.name} {isTier1 && <small style={{ color: '#10b981', fontSize: '10px', marginLeft: 4 }}>★ Tier 1</small>}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>
                      <strong>{geo.count}</strong> ({geo.percent}%)
                    </span>
                  </div>
                  <div style={{ height: 6, background: 'var(--surface-raised)', borderRadius: 9999, overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        height: '100%', 
                        width: `${Math.max(Number(geo.percent), 6)}%`, 
                        backgroundColor: isTier1 ? '#10b981' : 'var(--accent-brand)',
                        borderRadius: 9999
                      }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>


      {/* Top Performing Articles Table */}
      <section class={styles.dashboardSection} style={{ marginBottom: 32 }}>
        <h2 class={styles.sectionTitle}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
          Top Performing Articles
        </h2>

        <div class={styles.tableWrap}>
          <table class={styles.dataTable}>
            <thead>
              <tr>
                <th>Article Slug</th>
                <th>Unique Views</th>
                <th>Claps</th>
                <th>Engagement Score</th>
              </tr>
            </thead>
            <tbody>
              {postStats.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                    No article reads recorded yet.
                  </td>
                </tr>
              ) : (
                postStats.map(post => {
                  const score = post.views_count > 0 
                    ? ((post.claps_count / post.views_count) * 100).toFixed(1) 
                    : '0';
                  const isHighEngagement = Number(score) >= 15;

                  return (
                    <tr key={post.post_slug}>
                      <td>
                        <a 
                          href={`/articles/${post.post_slug}/`} 
                          target="_blank" 
                          rel="noreferrer"
                          style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 600 }}
                        >
                          /{post.post_slug}
                        </a>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{post.views_count}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{post.claps_count}</td>
                      <td class={isHighEngagement ? styles.engagementHigh : ''}>
                        {score}% {isHighEngagement && '★ High'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Monetization & Ad Readiness Advisor */}
      <div class={styles.advisorCard}>
        <div class={styles.advisorHeader}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" color="var(--accent-brand)">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <h3 class={styles.advisorTitle}>Monetization & Pro Readiness Advisor</h3>
        </div>

        <div class={styles.advisorGrid}>
          {/* Carbon Ads / Developer Ad Slot Check */}
          <div class={styles.advisorItem}>
            <div class={styles.advisorItemTitle}>
              <span class={totalBlogViews + totalToolViews > 2500 ? styles.statusReady : styles.statusPending}>
                ● {totalBlogViews + totalToolViews > 2500 ? 'Eligible' : 'Growth Phase'}
              </span>
              Developer Ads (Carbon / EthicalAds)
            </div>
            <p class={styles.advisorItemText}>
              Carbon and EthicalAds typically look for 5,000+ monthly developer views. Currently tracking <strong>{(totalBlogViews + totalToolViews).toLocaleString()}</strong> total combined impressions. When enabled, place a tasteful single ad slot on tool footers and article sidebars.
            </p>
          </div>

          {/* DevScrolls Pro Conversion Trigger */}
          <div class={styles.advisorItem}>
            <div class={styles.advisorItemTitle}>
              <span class={totalToolActions > 500 ? styles.statusReady : styles.statusPending}>
                ● {totalToolActions > 500 ? 'High Demand' : 'Accumulating Signals'}
              </span>
              DevScrolls Pro Feature Readiness
            </div>
            <p class={styles.advisorItemText}>
              Top intent actions: <strong>{totalToolActions}</strong> tool operations executed. Power users frequently scrubbing bulk logs or debugging multi-tenant JWTs are prime candidates for premium features like CLI sync, custom company regex presets, and automated CI/CD scans.
            </p>
          </div>

          {/* Sponsored Tool Placements */}
          <div class={styles.advisorItem}>
            <div class={styles.advisorItemTitle}>
              <span class={styles.statusReady}>● Active Strategy</span>
              Featured Job Board & Sponsor Slots
            </div>
            <p class={styles.advisorItemText}>
              Tools like PII Scrubber and JWT Debugger attract high-intent engineers daily. You can cross-promote featured remote jobs from <code>/jobs/</code> directly beneath the scrubber status bar to drive qualified developer applications.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
