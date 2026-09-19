import React, { useState, useMemo, useEffect } from 'react';
import styles from './JobBoard.module.css';

export interface Job {
  id: string;
  slug: string;
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  region: 'US' | 'EU' | 'Canada' | 'Worldwide' | string;
  workplaceType: 'Remote' | 'Hybrid' | 'On-site' | string;
  tags: string[];
  salary?: string;
  applyUrl: string;
  datePosted: string;
  source: string;
  descriptionSnippet: string;
}

interface JobBoardProps {
  jobs: Job[];
}

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d ago`;
  const diffInMonths = Math.floor(diffInDays / 30);
  return `${diffInMonths}mo ago`;
}

function getCompanyInitials(company: string): string {
  const clean = company.replace(/[^\w\s]/g, '').trim();
  const parts = clean.split(/\s+/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase() || 'TC';
}

const REGION_OPTIONS = [
  { key: 'ALL', label: 'All Regions' },
  { key: 'Worldwide', label: 'Worldwide' },
  { key: 'US', label: 'United States' },
  { key: 'EU', label: 'Europe & UK' },
  { key: 'Canada', label: 'Canada' },
  { key: 'APAC', label: 'Asia-Pacific & India' }
];

const POPULAR_TAGS = [
  'Frontend',
  'Backend',
  'Full-Stack',
  'React',
  'TypeScript',
  'Python',
  'Java',
  'Go',
  'AI / ML',
  'Node.js',
  'Rust',
  'Senior',
  'Staff/Lead'
];

export default function JobBoard({ jobs = [] }: JobBoardProps) {
  const [search, setSearch] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('ALL');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [onlySaved, setOnlySaved] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(25);
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [failedLogoIds, setFailedLogoIds] = useState<Set<string>>(new Set());

  // Load bookmarked jobs from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('devscrolls_saved_jobs');
      if (stored) {
        setSavedIds(new Set(JSON.parse(stored)));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Sync bookmarked jobs
  const toggleBookmark = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSavedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem('devscrolls_saved_jobs', JSON.stringify(Array.from(next)));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  // Keyboard shortcut to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveJob(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const hasActiveFilters = selectedRegion !== 'ALL' || selectedTag !== null || search.trim() !== '' || onlySaved;

  const resetFilters = () => {
    setSelectedRegion('ALL');
    setSelectedTag(null);
    setSearch('');
    setOnlySaved(false);
    setVisibleCount(25);
  };

  // Filter jobs
  const filteredJobs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return jobs.filter(job => {
      // Region filter
      if (selectedRegion !== 'ALL' && job.region !== selectedRegion) {
        return false;
      }
      // Tag filter
      if (selectedTag && !job.tags.includes(selectedTag)) {
        return false;
      }
      // Saved filter
      if (onlySaved && !savedIds.has(job.id)) {
        return false;
      }
      // Query filter
      if (q) {
        const matchTitle = job.title.toLowerCase().includes(q);
        const matchCompany = job.company.toLowerCase().includes(q);
        const matchLocation = job.location.toLowerCase().includes(q);
        const matchSalary = job.salary ? job.salary.toLowerCase().includes(q) : false;
        const matchTags = job.tags.some(t => t.toLowerCase().includes(q));
        if (!matchTitle && !matchCompany && !matchLocation && !matchSalary && !matchTags) {
          return false;
        }
      }
      return true;
    });
  }, [jobs, search, selectedRegion, selectedTag, onlySaved, savedIds]);

  const displayedJobs = useMemo(() => {
    return filteredJobs.slice(0, visibleCount);
  }, [filteredJobs, visibleCount]);

  return (
    <div className={styles.container}>
      {/* Compact Utility Header */}
      <header className={styles.utilityHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.titleRow}>
            <h1 className={styles.compactTitle}>Remote Developer Jobs</h1>
            <span className={styles.liveCountBadge}>
              <span className={styles.pulseDot} />
              {jobs.length} Active Roles
            </span>
          </div>
          <p className={styles.microTrust}>
            <span>🛡️ Direct corporate feeds & ATS applications</span>
            <span className={styles.dotDivider}>•</span>
            <span>Zero ghost jobs or recruiter middlemen</span>
            <span className={styles.dotDivider}>•</span>
            <span>Updated daily</span>
          </p>
        </div>

        <div className={styles.headerRight}>
          <a href="/jobs/post/" className={styles.postRoleBtn}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>Post a Job</span>
            <span className={styles.freeBadge}>Free</span>
          </a>
        </div>
      </header>

      {/* Unified Search and Filter Control Deck */}
      <section className={styles.filterDeck} aria-label="Search and Filters">
        {/* Search Bar with Clear Icon */}
        <div className={styles.searchContainer}>
          <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by role, language, or company (e.g. Backend, Python, React, Linear, Staff)..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setVisibleCount(25);
            }}
          />
          {search && (
            <button
              type="button"
              className={styles.clearSearchBtn}
              onClick={() => setSearch('')}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Region Filter Row */}
        <div className={styles.filterBlock}>
          <div className={styles.filterHeader}>
            <span className={styles.filterLabel}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg>
              Region:
            </span>
            {hasActiveFilters && (
              <button 
                type="button"
                className={styles.resetAllBtn}
                onClick={resetFilters}
              >
                ✕ Reset all filters
              </button>
            )}
          </div>
          <div className={styles.pillRow}>
            {REGION_OPTIONS.map(opt => (
              <button
                key={opt.key}
                type="button"
                className={`${styles.pillBtn} ${selectedRegion === opt.key ? styles.pillBtnActive : ''}`}
                onClick={() => {
                  setSelectedRegion(opt.key);
                  setVisibleCount(25);
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tech Stack & Skills Filter Row */}
        <div className={styles.filterBlock}>
          <div className={styles.filterHeader}>
            <span className={styles.filterLabel}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
              Tech Stack & Role:
            </span>
          </div>
          <div className={styles.pillRow}>
            {POPULAR_TAGS.map(tag => (
              <button
                key={tag}
                type="button"
                className={`${styles.pillBtn} ${selectedTag === tag ? styles.pillBtnActive : ''}`}
                onClick={() => {
                  setSelectedTag(selectedTag === tag ? null : tag);
                  setVisibleCount(25);
                }}
              >
                {tag}
              </button>
            ))}

            {savedIds.size > 0 && (
              <button
                type="button"
                className={`${styles.pillBtn} ${onlySaved ? styles.pillBtnActive : ''}`}
                onClick={() => setOnlySaved(!onlySaved)}
                style={{ marginLeft: 'auto' }}
              >
                <span>★ Saved</span>
                <span className={styles.savedBadge}>{savedIds.size}</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Results Meta Bar */}
      <div className={styles.resultsMeta}>
        <span>
          Showing <span className={styles.resultsCount}>{displayedJobs.length}</span> of{' '}
          <span className={styles.resultsCount}>{filteredJobs.length}</span> verified roles
        </span>
        <span>Updated daily</span>
      </div>

      {/* Jobs List */}
      {displayedJobs.length > 0 ? (
        <div className={styles.jobsList}>
          {displayedJobs.map(job => {
            const isSaved = savedIds.has(job.id);
            const showLogo = job.companyLogo && !failedLogoIds.has(job.id);

            return (
              <article 
                key={job.id} 
                className={styles.jobCard}
                onClick={() => setActiveJob(job)}
              >
                {/* Company Logo / Monogram Avatar */}
                <div className={styles.companyAvatar} title={job.company}>
                  {showLogo ? (
                    <img 
                      src={job.companyLogo} 
                      alt={`${job.company} logo`} 
                      loading="lazy"
                      onError={() => {
                        setFailedLogoIds(prev => new Set(prev).add(job.id));
                      }} 
                    />
                  ) : (
                    <span>{getCompanyInitials(job.company)}</span>
                  )}
                </div>

                {/* Job Main Information */}
                <div className={styles.jobMain}>
                  <div className={styles.jobHeader}>
                    <h2 className={styles.jobTitle}>{job.title}</h2>
                    <span className={styles.companyName}>at {job.company}</span>
                  </div>

                  <div className={styles.jobMetaRow}>
                    <span className={styles.metaItem}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      <span>{job.location}</span>
                    </span>
                    {job.salary && (
                      <span className={styles.salaryBadge}>💰 {job.salary}</span>
                    )}
                  </div>

                  <div className={styles.tagsRow}>
                    {job.tags.map(t => (
                      <span key={t} className={styles.tagPill}>{t}</span>
                    ))}
                  </div>
                </div>

                {/* Job Actions */}
                <div className={styles.jobActions}>
                  <span className={styles.dateAgo}>{timeAgo(job.datePosted)}</span>

                  <button 
                    type="button"
                    className={`${styles.bookmarkBtn} ${isSaved ? styles.bookmarkBtnActive : ''}`}
                    title={isSaved ? 'Remove from saved' : 'Save job'}
                    onClick={(e) => toggleBookmark(e, job.id)}
                    aria-label="Save job"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </button>

                  <a 
                    href={job.applyUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={styles.applyBtn}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span>Apply</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <h3 className={styles.emptyTitle}>No matching roles found</h3>
          <p>Try clearing your search query or selecting a broader region filter.</p>
          {hasActiveFilters && (
            <button 
              type="button" 
              className={styles.pillBtn} 
              onClick={resetFilters} 
              style={{ marginTop: '1rem' }}
            >
              Reset all filters
            </button>
          )}
        </div>
      )}

      {/* Load More Button */}
      {filteredJobs.length > visibleCount && (
        <div className={styles.loadMoreWrapper}>
          <button 
            type="button"
            className={styles.loadMoreBtn}
            onClick={() => setVisibleCount(c => c + 25)}
          >
            Load More Jobs ({filteredJobs.length - visibleCount} remaining)
          </button>
        </div>
      )}

      {/* Modal Job Details View */}
      {activeJob && (
        <div className={styles.modalOverlay} onClick={() => setActiveJob(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button 
              type="button"
              className={styles.modalClose} 
              onClick={() => setActiveJob(null)}
              aria-label="Close modal"
            >
              ✕
            </button>

            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{activeJob.title}</h2>
              <div className={styles.modalCompany}>{activeJob.company} • {activeJob.source}</div>
            </div>

            <div className={styles.modalMetaGrid}>
              <div className={styles.modalMetaBlock}>
                <span className={styles.modalMetaLabel}>Location</span>
                <span className={styles.modalMetaVal}>{activeJob.location}</span>
              </div>
              <div className={styles.modalMetaBlock}>
                <span className={styles.modalMetaLabel}>Workplace Type</span>
                <span className={styles.modalMetaVal}>{activeJob.workplaceType}</span>
              </div>
              {activeJob.salary && (
                <div className={styles.modalMetaBlock}>
                  <span className={styles.modalMetaLabel}>Compensation</span>
                  <span className={styles.modalMetaVal} style={{ color: '#16a34a' }}>{activeJob.salary}</span>
                </div>
              )}
              <div className={styles.modalMetaBlock}>
                <span className={styles.modalMetaLabel}>Posted</span>
                <span className={styles.modalMetaVal}>{timeAgo(activeJob.datePosted)}</span>
              </div>
            </div>

            <p className={styles.modalSnippet}>{activeJob.descriptionSnippet}</p>

            <a 
              href={activeJob.applyUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.modalApplyBtn}
            >
              <span>Apply Directly on Company Careers Page</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
