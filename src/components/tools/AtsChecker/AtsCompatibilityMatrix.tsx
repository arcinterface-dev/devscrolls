import React from 'react';
import type { AtsSystemAudit } from '../../../lib/ats/types';

interface AtsCompatibilityMatrixProps {
  systems: AtsSystemAudit[];
}

export const AtsCompatibilityMatrix: React.FC<AtsCompatibilityMatrixProps> = ({ systems }) => {
  return (
    <div className="ats-card ats-compatibility-section">
      <div className="ats-card-header">
        <div className="ats-card-header-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
          <h3>ATS Parser Compatibility Audit</h3>
        </div>
        <span className="ats-card-header-badge">Top 4 Enterprise Platforms</span>
      </div>

      <p className="ats-section-desc">
        Different hiring platforms parse plain text differently. Here is how your resume structure performs across major corporate screening engines:
      </p>

      <div className="ats-systems-grid">
        {systems.map((sys) => {
          const isPass = sys.status === 'pass';
          const isWarn = sys.status === 'warning';
          const brandSlug = sys.system.toLowerCase();

          return (
            <div key={sys.system} className={`ats-system-card ats-system-status-${sys.status}`}>
              <div className="ats-system-header">
                <div className="ats-system-title-wrap">
                  <span className={`ats-system-avatar ats-avatar-${brandSlug}`}>
                    {sys.system.slice(0, 1)}
                  </span>
                  <div className="ats-system-name-group">
                    <span className="ats-system-name">{sys.system}</span>
                    <span className="ats-system-category">
                      {sys.system === 'Workday' && 'Enterprise ATS'}
                      {sys.system === 'Greenhouse' && 'Mid-Market & Scale-ups'}
                      {sys.system === 'Lever' && 'Tech & Startups'}
                      {sys.system === 'Ashby' && 'Modern High-Growth'}
                    </span>
                  </div>
                </div>
                <span className={`ats-status-pill ats-pill-${sys.status}`}>
                  <span className="ats-status-dot" />
                  {isPass && 'High Pass Rate'}
                  {isWarn && 'Potential Warning'}
                  {!isPass && !isWarn && 'Scramble Risk'}
                </span>
              </div>
              <div className="ats-system-divider" />
              <div className="ats-system-body">
                <div className="ats-system-summary">{sys.summary}</div>
                <p className="ats-system-detail">{sys.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
