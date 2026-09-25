import React, { useState } from 'react';

export const MonetizationCTA: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const sampleMarkdownTemplate = `# FirstName LastName
Senior Software Engineer | San Francisco, CA | Remote (US)
alex.chen@example.com | (555) 019-2834 | linkedin.com/in/yourprofile | github.com/yourusername

## PROFESSIONAL SUMMARY
Senior Software Engineer with 7+ years of experience architecting distributed web applications and high-throughput microservices. Specialized in TypeScript, React, and Node.js. Proven record of cutting latency and scaling systems to 1M+ active users.

## TECHNICAL SKILLS
- Languages: TypeScript, JavaScript, Python, Go, SQL
- Frameworks & Libraries: React, Next.js, Node.js, Express, Tailwind CSS, GraphQL
- Cloud & DevOps: AWS (ECS, S3, CloudFront), Docker, Kubernetes, CI/CD, Terraform
- Architecture & Testing: System Design, Jest, Vitest, Playwright, TDD

## WORK EXPERIENCE
### Senior Frontend Engineer | ScaleFlow Systems | Jan 2022 – Present | Remote
- Architected modular Next.js SSR architecture, improving Lighthouse performance score from 42 to 96.
- Reduced P95 First Contentful Paint (FCP) from 2.4s to 650ms (73% decrease) across 1.2M monthly enterprise users.
- Spearheaded company-wide design system in Tailwind CSS, accelerating feature velocity by 35%.
- Built automated end-to-end testing suite with Playwright and GitHub Actions, preventing 14 regression incidents.

### Software Engineer | CloudVantage Inc. | Mar 2019 – Dec 2021 | San Francisco, CA
- Engineered real-time dashboard in React and TypeScript streaming 50,000 live metrics via WebSockets with zero frame drops.
- Optimized state management by migrating from legacy Redux to Zustand, reducing bundle size by 48kB.
- Automated frontend CI/CD pipelines on AWS S3 and CloudFront, reducing release cycle time from 45 mins to 4 mins.

## KEY PROJECTS
### DailyScroll Open-Source Developer Companion | github.com/yourusername/dailyscroll
- Built local-first keyboard-driven developer companion in Astro and React. Over 1,500 GitHub stars and 8,000 active users.

## EDUCATION
Bachelor of Science in Computer Science | University of California, Berkeley | 2015 – 2019
`;

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(sampleMarkdownTemplate);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([sampleMarkdownTemplate], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ATS_Friendly_Developer_Resume_Template.md';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="ats-card ats-monetization-section">
      <div className="ats-monetize-grid">
        {/* Template Box */}
        <div className="ats-monetize-box ats-template-box">
          <div className="ats-box-icon">📄</div>
          <div className="ats-box-content">
            <h4>Free ATS-Proof Developer Resume Template</h4>
            <p>
              Pre-structured, single-column Markdown & plain-text template engineered to sail through Workday, Greenhouse, and Lever without formatting glitches.
            </p>
            <div className="ats-template-actions">
              <button onClick={handleDownloadTemplate} className="ats-btn-primary">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Download (.md)
              </button>
              <button onClick={handleCopyTemplate} className="ats-btn-secondary">
                {copied ? '✓ Copied to Clipboard!' : 'Copy Template'}
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
  );
};
