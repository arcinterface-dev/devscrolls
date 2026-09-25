import React from 'react';
import type { MatchedJob } from '../../../lib/ats/types';

interface MatchedJobsViewProps {
  jobs: MatchedJob[];
}

export const MatchedJobsView: React.FC<MatchedJobsViewProps> = ({ jobs }) => {
  return (
    <div className="ats-card ats-matched-jobs-section">
      <div className="ats-card-header">
        <div className="ats-card-header-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
          </svg>
          <h3>Verified Remote Roles Matching Your Resume</h3>
        </div>
        <span className="ats-card-header-badge ats-badge-live">Live from DevScrolls</span>
      </div>

      <p className="ats-section-desc">
        Based on your detected technical stack, here are open, verified remote positions with direct ATS application links (no recruiters or ghost listings):
      </p>

      {jobs.length === 0 ? (
        <div className="ats-no-jobs">
          <p>No immediate role matches found. Explore our full live directory of remote engineering positions.</p>
          <a href="/jobs/" className="ats-browse-jobs-btn">
            View All Remote Developer Jobs →
          </a>
        </div>
      ) : (
        <div className="ats-jobs-grid">
          {jobs.map((job) => (
            <div key={job.id} className="ats-job-card">
              <div className="ats-job-top">
                <span className="ats-job-company">{job.company}</span>
                <span className="ats-job-location">{job.location}</span>
              </div>

              <h4 className="ats-job-title">{job.title}</h4>

              {job.matchingSkills.length > 0 && (
                <div className="ats-matching-badge">
                  <span>Match:</span> {job.matchingSkills.join(', ')}
                </div>
              )}

              <div className="ats-job-tags">
                {job.tags.map((tag) => (
                  <span key={tag} className="ats-job-tag">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="ats-job-footer">
                <a
                  href={job.applyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ats-job-apply-link"
                >
                  Direct Apply →
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="ats-jobs-footer-cta">
        <a href="/jobs/" className="ats-view-all-jobs-btn">
          Explore All 250+ Remote Software Roles on DevScrolls →
        </a>
      </div>
    </div>
  );
};
