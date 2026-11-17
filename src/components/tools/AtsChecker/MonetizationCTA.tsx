import React, { useState } from 'react';
import { ResumeTemplateModal } from './ResumeTemplateModal';

export const MonetizationCTA: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'markdown' | 'latex' | 'xyz'>('markdown');

  const openWithTab = (tab: 'markdown' | 'latex' | 'xyz') => {
    setModalTab(tab);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="ats-card ats-monetization-section">
        <div className="ats-monetize-grid">
          {/* Template Box */}
          <div className="ats-monetize-box ats-template-box">
            <div className="ats-box-icon">📄</div>
            <div className="ats-box-content">
              <h4>ATS-Proof Developer Resume Pack & Formula Bank</h4>
              <p>
                Single-column Markdown & LaTeX templates + 50 Google X-Y-Z action bullet examples. Engineered to score 95+ across Workday, Greenhouse, and Lever.
              </p>
              <div className="ats-template-actions">
                <button 
                  onClick={() => openWithTab('markdown')} 
                  className="ats-btn-primary"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                  </svg>
                  Get Resume Template
                </button>
                <button 
                  onClick={() => openWithTab('xyz')} 
                  className="ats-btn-secondary"
                >
                  50 X-Y-Z Bullets
                </button>
              </div>
            </div>
          </div>

          {/* Employer Hiring Box */}
          <div className="ats-monetize-box ats-employer-box">
            <div className="ats-box-icon">💼</div>
            <div className="ats-box-content">
              <h4>Hiring Senior Remote Developers?</h4>
              <p>
                Place your open engineering role directly in front of active applicants whose resumes score 85%+ in your required tech stack.
              </p>
              <a href="/jobs/post/" className="ats-employer-link">
                Post a Remote Job for Free (100% Free) →
              </a>
            </div>
          </div>
        </div>
      </div>

      <ResumeTemplateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialTab={modalTab}
      />
    </>
  );
};
