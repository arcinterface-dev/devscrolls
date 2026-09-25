import React, { useState } from 'react';
import type { CategoryScore, SuggestionItem } from '../../../lib/ats/types';

interface CategoryBreakdownProps {
  categories: CategoryScore[];
  suggestions: SuggestionItem[];
}

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({ categories, suggestions }) => {
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning'>('all');

  const filteredSuggestions = suggestions.filter((item) => {
    if (filter === 'all') return true;
    return item.type === filter;
  });

  const criticalCount = suggestions.filter((s) => s.type === 'critical').length;
  const warningCount = suggestions.filter((s) => s.type === 'warning').length;

  return (
    <div className="ats-card ats-breakdown-section">
      <div className="ats-card-header">
        <div className="ats-card-header-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
          <h3>5-Dimension Score Breakdown</h3>
        </div>
      </div>

      <div className="ats-categories-list">
        {categories.map((cat) => {
          const percentage = Math.round((cat.score / cat.maxScore) * 100);
          let barColor = 'var(--state-success)';
          if (percentage < 55) barColor = 'var(--state-error)';
          else if (percentage < 75) barColor = 'var(--state-warning)';

          return (
            <div key={cat.id} className="ats-category-row">
              <div className="ats-category-top">
                <span className="ats-category-name">{cat.name}</span>
                <span className="ats-category-points">
                  <strong>{cat.score}</strong> / {cat.maxScore} pts
                </span>
              </div>
              <div className="ats-cat-progress-track">
                <div
                  className="ats-cat-progress-fill"
                  style={{ width: `${percentage}%`, backgroundColor: barColor }}
                />
              </div>
              <div className="ats-category-summary">{cat.summary}</div>
            </div>
          );
        })}
      </div>

      {/* Prioritized Actionable Fixes */}
      <div className="ats-fixes-block">
        <div className="ats-fixes-header">
          <h4>Prioritized Actionable Fixes</h4>
          <div className="ats-fixes-filters">
            <button
              className={`ats-filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({suggestions.length})
            </button>
            <button
              className={`ats-filter-btn ${filter === 'critical' ? 'active' : ''}`}
              onClick={() => setFilter('critical')}
            >
              Critical ({criticalCount})
            </button>
            <button
              className={`ats-filter-btn ${filter === 'warning' ? 'active' : ''}`}
              onClick={() => setFilter('warning')}
            >
              Warnings ({warningCount})
            </button>
          </div>
        </div>

        {filteredSuggestions.length === 0 ? (
          <div className="ats-no-issues">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--state-success)" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <p>No issues found in this filter category! Your formatting is clean.</p>
          </div>
        ) : (
          <div className="ats-suggestions-list">
            {filteredSuggestions.map((item) => {
              const isCrit = item.type === 'critical';

              return (
                <div key={item.id} className={`ats-suggestion-card ${isCrit ? 'is-critical' : 'is-warning'}`}>
                  <div className="ats-sugg-top">
                    <span className={`ats-sugg-badge ${isCrit ? 'badge-critical' : 'badge-warning'}`}>
                      {isCrit ? 'Critical Fix' : 'Recommendation'}
                    </span>
                    <h5 className="ats-sugg-title">{item.title}</h5>
                  </div>

                  <p className="ats-sugg-issue">{item.issue}</p>

                  <div className="ats-sugg-fix-box">
                    <span className="ats-sugg-fix-label">How to fix:</span>
                    <p className="ats-sugg-fix-text">{item.fix}</p>
                  </div>

                  {item.example && (
                    <div className="ats-sugg-example-box">
                      <span className="ats-sugg-example-label">Example:</span>
                      <code>{item.example}</code>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
