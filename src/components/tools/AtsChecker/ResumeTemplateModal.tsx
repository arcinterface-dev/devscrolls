import React, { useState } from 'react';
import {
  DEVELOPER_RESUME_MARKDOWN,
  DEVELOPER_RESUME_LATEX,
  GOOGLE_XYZ_CHEAT_SHEET,
} from '../../../lib/ats/resume-templates';

interface ResumeTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'markdown' | 'latex' | 'xyz';
}

export const ResumeTemplateModal: React.FC<ResumeTemplateModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'markdown',
}) => {
  const [activeTab, setActiveTab] = useState<'markdown' | 'latex' | 'xyz'>(initialTab);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [toastMessage, setToastMessage] = useState<string>('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`✓ Copied ${label} to clipboard!`);
  };

  const handleDownload = (content: string, fileName: string, mime: string) => {
    const blob = new Blob([content], { type: `${mime};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`✓ Downloaded ${fileName}!`);
  };

  const categories = ['All', 'Frontend & Performance', 'Backend & Systems', 'Database & Data', 'Cloud & DevOps', 'Leadership & Quality'];
  const filteredBullets = activeCategory === 'All' 
    ? GOOGLE_XYZ_CHEAT_SHEET 
    : GOOGLE_XYZ_CHEAT_SHEET.filter(b => b.category === activeCategory);

  return (
    <div className="ats-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div 
        className="ats-modal-card ats-template-modal-card" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="ats-modal-header">
          <div className="ats-modal-header-left">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <h3>ATS-Proof Resume Templates & Formula Bank</h3>
          </div>
          <button onClick={onClose} className="ats-modal-close-btn" aria-label="Close modal">
            ✕
          </button>
        </div>

        <p className="ats-modal-desc">
          Single-column templates engineered without multi-column layouts, tables, or unparsed icons. Guaranteed to sail through Workday, Greenhouse, and Lever.
        </p>

        {/* Tab Navigation */}
        <div className="ats-tab-nav">
          <button 
            className={`ats-tab-btn ${activeTab === 'markdown' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('markdown')}
          >
            Markdown Template (.md)
          </button>
          <button 
            className={`ats-tab-btn ${activeTab === 'latex' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('latex')}
          >
            LaTeX Overleaf (.tex)
          </button>
          <button 
            className={`ats-tab-btn ${activeTab === 'xyz' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('xyz')}
          >
            Google X-Y-Z Cheat Sheet ({GOOGLE_XYZ_CHEAT_SHEET.length})
          </button>
        </div>

        {/* Toast Alert */}
        {toastMessage && <div className="ats-modal-toast">{toastMessage}</div>}

        {/* Tab 1: Markdown Template */}
        {activeTab === 'markdown' && (
          <div className="ats-tab-content">
            <div className="ats-template-code-preview">
              <pre><code>{DEVELOPER_RESUME_MARKDOWN}</code></pre>
            </div>
            <div className="ats-modal-actions">
              <button 
                onClick={() => handleDownload(DEVELOPER_RESUME_MARKDOWN, 'ATS_Developer_Resume_Template.md', 'text/markdown')}
                className="ats-btn-primary"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Download (.md)
              </button>
              <button 
                onClick={() => handleCopy(DEVELOPER_RESUME_MARKDOWN, 'Markdown template')}
                className="ats-btn-secondary"
              >
                Copy Markdown
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: LaTeX Template */}
        {activeTab === 'latex' && (
          <div className="ats-tab-content">
            <div className="ats-template-code-preview">
              <pre><code>{DEVELOPER_RESUME_LATEX}</code></pre>
            </div>
            <div className="ats-modal-actions">
              <button 
                onClick={() => handleDownload(DEVELOPER_RESUME_LATEX, 'ATS_Developer_Resume_Template.tex', 'text/plain')}
                className="ats-btn-primary"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Download LaTeX (.tex)
              </button>
              <button 
                onClick={() => handleCopy(DEVELOPER_RESUME_LATEX, 'LaTeX template')}
                className="ats-btn-secondary"
              >
                Copy LaTeX Code
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Google X-Y-Z Action Formula Bank */}
        {activeTab === 'xyz' && (
          <div className="ats-tab-content ats-xyz-tab">
            <div className="ats-category-pills">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`ats-cat-pill ${activeCategory === cat ? 'is-active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="ats-xyz-list">
              {filteredBullets.map((bullet, idx) => (
                <div key={idx} className="ats-xyz-item">
                  <div className="ats-xyz-item-header">
                    <span className="ats-xyz-role">{bullet.role}</span>
                    <span className="ats-xyz-category-tag">{bullet.category}</span>
                  </div>
                  
                  <div className="ats-xyz-compare">
                    <div className="ats-xyz-line weak">
                      <span className="ats-xyz-label">❌ Passive:</span>
                      <p>{bullet.weak}</p>
                    </div>
                    <div className="ats-xyz-line strong">
                      <span className="ats-xyz-label">✅ Google X-Y-Z:</span>
                      <p>{bullet.strong}</p>
                    </div>
                  </div>

                  <div className="ats-xyz-actions">
                    <span className="ats-xyz-metric-pill">Metrics: {bullet.impactMetrics}</span>
                    <button
                      onClick={() => {
                        handleCopy(bullet.strong, 'bullet point');
                        setCopiedIndex(idx);
                        setTimeout(() => setCopiedIndex(null), 2000);
                      }}
                      className="ats-xyz-copy-btn"
                    >
                      {copiedIndex === idx ? '✓ Copied' : 'Copy Bullet'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Newsletter Opt-In Lead Magnet */}
        <div className="ats-modal-newsletter-box">
          <div className="ats-modal-newsletter-text">
            <strong>Want new weekly technical interview breakdowns & system design guides?</strong>
            <p>Join 1,000+ engineers reading DevScrolls. Zero spam, unsubscribe anytime.</p>
          </div>
          <form 
            action="https://app.kit.com/forms/9632861/subscriptions" 
            method="post" 
            className="ats-modal-newsletter-form"
            target="_blank"
          >
            <input 
              type="email" 
              name="email_address" 
              placeholder="you@example.com" 
              required 
              className="ats-modal-newsletter-input"
            />
            <button type="submit" className="ats-btn-primary">
              Subscribe Free
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
