import React, { useState } from 'react';
import type { AtsScoreResult } from '../../../lib/ats/types';
import { parseResumeFile } from '../../../lib/ats/parser';
import { calculateAtsScore } from '../../../lib/ats/scorer';
import { DEMO_SAMPLE_RESUME } from '../../../lib/ats/demo-sample';
import { trackToolEvent } from '../../../lib/analytics';
import { UploadZone } from './UploadZone';
import { ScoreGauge } from './ScoreGauge';
import { AtsCompatibilityMatrix } from './AtsCompatibilityMatrix';
import { CategoryBreakdown } from './CategoryBreakdown';
import { DetectedSkillsView } from './DetectedSkillsView';
import { MatchedJobsView } from './MatchedJobsView';
import { MonetizationCTA } from './MonetizationCTA';
import { ShareCardModal } from './ShareCardModal';
import './ats-checker.css';

export default function AtsChecker() {
  const [status, setStatus] = useState<'idle' | 'processing' | 'results'>('idle');
  const [loadingStep, setLoadingStep] = useState<string>('Reading document structure...');
  const [result, setResult] = useState<AtsScoreResult | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);

  const handleFile = async (file: File) => {
    setErrorMessage(null);
    setCurrentFileName(file.name);
    setStatus('processing');
    setLoadingStep('Extracting text layer and page structure...');

    try {
      // 1. In-browser extraction
      const extracted = await parseResumeFile(file);

      // 2. Scoring step
      setLoadingStep('Auditing ATS parseability, keywords, and metrics...');
      await new Promise((resolve) => setTimeout(resolve, 200)); // smooth step transition

      const calculated = calculateAtsScore(extracted);

      setLoadingStep('Matching detected skills with live remote developer roles...');
      await new Promise((resolve) => setTimeout(resolve, 150));

      setResult(calculated);
      setStatus('results');

      // Track non-blocking analytics
      trackToolEvent('ats-checker', 'action', 'scan_completed', {
        score: calculated.overallScore,
        wordCount: calculated.metrics.wordCount,
        fileType: extracted.fileType,
      });
    } catch (err: any) {
      console.error('[ATS Scroll]', err);
      setStatus('idle');
      setErrorMessage(err?.message || 'An unexpected error occurred while parsing the resume.');
    }
  };

  const handleLoadSample = () => {
    setErrorMessage(null);
    setCurrentFileName(DEMO_SAMPLE_RESUME.fileName);
    setStatus('processing');
    setLoadingStep('Analyzing sample senior developer resume...');

    setTimeout(() => {
      const calculated = calculateAtsScore(DEMO_SAMPLE_RESUME);
      setResult(calculated);
      setStatus('results');

      trackToolEvent('ats-checker', 'action', 'demo_loaded', {
        score: calculated.overallScore,
      });
    }, 400);
  };

  const handleReset = () => {
    setResult(null);
    setStatus('idle');
    setErrorMessage(null);
    setCurrentFileName('');
  };

  const handleShareScore = () => {
    if (!result) return;
    const shareText = `My developer resume scored ${result.overallScore}/100 on ATS Scroll! 🚀 Test your resume with 100% in-browser privacy: https://devscrolls.dev/ats-checker/`;
    navigator.clipboard.writeText(shareText);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  return (
    <div className="ats-tool-wrapper">
      {/* Tool Header */}
      <header className="ats-tool-header">
        <div className="ats-badge-row">
          <span className="ats-badge-pill">100% Client-Side</span>
          <span className="ats-badge-pill">Zero Server Storage</span>
          <span className="ats-badge-pill ats-badge-highlight">Free Forever</span>
        </div>
        <h1 className="ats-tool-title">ATS Scroll — Resume Score & Job Matcher</h1>
        <p className="ats-tool-subtitle">
          Audit your engineering resume against Workday, Greenhouse, and Lever parsing engines. 
          Extract skills, find layout traps, and get matched with verified remote developer roles.
        </p>
      </header>

      {/* Processing State */}
      {status === 'processing' && (
        <div className="ats-loading-container">
          <div className="ats-spinner" />
          <h3 className="ats-loading-title">Analyzing Resume</h3>
          <p className="ats-loading-step">{loadingStep}</p>
          <span className="ats-loading-privacy-tag">
            🔒 Executing locally in Web Worker. No data is being uploaded.
          </span>
        </div>
      )}

      {/* Upload State */}
      {status === 'idle' && (
        <UploadZone
          onFileSelected={handleFile}
          onLoadSample={handleLoadSample}
          isLoading={false}
          errorMessage={errorMessage}
        />
      )}

      {/* Results View */}
      {status === 'results' && result && (
        <div className="ats-results-view">
          {/* Top Actions Bar */}
          <div className="ats-results-toolbar">
            <button onClick={handleReset} className="ats-toolbar-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              Scan Another Resume
            </button>

            <button onClick={() => setIsShareModalOpen(true)} className="ats-toolbar-btn ats-share-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
              Share Score Card (Image)
            </button>
          </div>

          {/* 1. Score Gauge Hero */}
          <ScoreGauge
            score={result.overallScore}
            verdict={result.verdict}
            metrics={result.metrics}
            fileName={currentFileName}
          />

          {/* 2. Matched Jobs Bridge (Direct value to job board) */}
          <MatchedJobsView jobs={result.matchedJobs} />

          {/* 3. ATS Systems Audit Matrix */}
          <AtsCompatibilityMatrix systems={result.atsSystems} />

          {/* 4. 5-Dimension Category Breakdown & Actionable Fixes */}
          <CategoryBreakdown
            categories={result.categories}
            suggestions={result.suggestions}
          />

          {/* 5. Detected Technical Competencies */}
          <DetectedSkillsView skills={result.detectedSkills} />

          {/* 6. Monetization & Free Template Download */}
          <MonetizationCTA />

          {/* 7. Share Card Modal with Canvas Image Generator */}
          <ShareCardModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            result={result}
            fileName={currentFileName}
          />
        </div>
      )}
    </div>
  );
}
