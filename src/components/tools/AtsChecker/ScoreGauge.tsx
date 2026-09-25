import React from 'react';
import type { AtsScoreResult } from '../../../lib/ats/types';

interface ScoreGaugeProps {
  score: number;
  verdict: AtsScoreResult['verdict'];
  metrics: AtsScoreResult['metrics'];
  fileName: string;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score, verdict, metrics, fileName }) => {
  // SVG circular progress calculation
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="ats-score-hero">
      <div className="ats-score-main">
        <div className="ats-gauge-container">
          <svg className="ats-gauge-svg" width="160" height="160" viewBox="0 0 160 160">
            {/* Background Circle */}
            <circle
              className="ats-gauge-bg"
              cx="80"
              cy="80"
              r={radius}
              strokeWidth="12"
              fill="transparent"
            />
            {/* Progress Circle */}
            <circle
              className="ats-gauge-fill"
              cx="80"
              cy="80"
              r={radius}
              strokeWidth="12"
              fill="transparent"
              stroke={verdict.color}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 80 80)"
            />
          </svg>
          <div className="ats-gauge-text">
            <span className="ats-gauge-number" style={{ color: verdict.color }}>
              {score}
            </span>
            <span className="ats-gauge-out-of">/ 100</span>
          </div>
        </div>

        <div className="ats-verdict-content">
          <div className="ats-file-pill">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
            <span className="ats-file-name">{fileName}</span>
          </div>

          <div className="ats-verdict-badge" style={{ backgroundColor: `${verdict.color}15`, color: verdict.color, borderColor: `${verdict.color}40` }}>
            <span className="ats-verdict-dot" style={{ backgroundColor: verdict.color }} />
            {verdict.label}
          </div>

          <p className="ats-verdict-summary">{verdict.summary}</p>
        </div>
      </div>

      <div className="ats-metrics-bar">
        <div className="ats-metric-item">
          <span className="ats-metric-val">{metrics.wordCount}</span>
          <span className="ats-metric-label">Total Words</span>
        </div>
        <div className="ats-metric-divider" />
        <div className="ats-metric-item">
          <span className="ats-metric-val">{metrics.actionVerbCount}</span>
          <span className="ats-metric-label">Action Verbs</span>
        </div>
        <div className="ats-metric-divider" />
        <div className="ats-metric-item">
          <span className="ats-metric-val">{metrics.quantifiableMetricCount}</span>
          <span className="ats-metric-label">Metrics Found</span>
        </div>
        <div className="ats-metric-divider" />
        <div className="ats-metric-item">
          <span className="ats-metric-val">{metrics.detectedSkillCount}</span>
          <span className="ats-metric-label">Skills Indexed</span>
        </div>
      </div>
    </div>
  );
};
