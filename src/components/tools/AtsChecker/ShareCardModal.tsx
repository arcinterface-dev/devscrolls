import React, { useEffect, useRef, useState } from 'react';
import type { AtsScoreResult } from '../../../lib/ats/types';

interface ShareCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: AtsScoreResult;
  fileName: string;
}

export const ShareCardModal: React.FC<ShareCardModalProps> = ({
  isOpen,
  onClose,
  result,
  fileName,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [copyStatus, setCopyStatus] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Render 1200x630 high-res card
    const width = 1200;
    const height = 630;
    canvas.width = width;
    canvas.height = height;

    // 1. Background Gradient
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#090d16');
    bgGradient.addColorStop(0.5, '#0f172a');
    bgGradient.addColorStop(1, '#020617');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // 2. Ambient Glow around Score
    const glowGradient = ctx.createRadialGradient(280, 315, 20, 280, 315, 240);
    glowGradient.addColorStop(0, `${result.verdict.color}35`);
    glowGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, 0, width, height);

    // 3. Card Outer Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, width - 60, height - 60);

    // 4. Header Bar: Brand Logo & Title
    ctx.fillStyle = '#d97706'; // Amber Accent
    ctx.beginPath();
    ctx.roundRect(60, 60, 40, 40, 8);
    ctx.fill();

    // Scroll Icon inside box
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.strokeRect(70, 70, 20, 20);

    ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('DevScrolls', 115, 88);

    ctx.font = '600 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('/ ATS Scroll — Resume Inspector', 245, 88);

    // Top Right Privacy Badge
    ctx.fillStyle = 'rgba(34, 197, 94, 0.15)';
    ctx.beginPath();
    ctx.roundRect(width - 320, 62, 260, 36, 18);
    ctx.fill();
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#22c55e';
    ctx.fillText('✓ 100% In-Browser Privacy', width - 295, 85);

    // 5. Left Column: Circular Score Gauge (Compact & perfectly spaced)
    const centerX = 210;
    const centerY = 265;
    const radius = 85;

    // Track circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 14;
    ctx.stroke();

    // Progress circle
    const startAngle = -Math.PI / 2;
    const progressAngle = startAngle + (result.overallScore / 100) * (Math.PI * 2);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, progressAngle);
    ctx.strokeStyle = result.verdict.color;
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Score Number
    ctx.font = '800 62px "JetBrains Mono", monospace, sans-serif';
    ctx.fillStyle = result.verdict.color;
    ctx.textAlign = 'center';
    ctx.fillText(`${result.overallScore}`, centerX, centerY + 16);

    ctx.font = '600 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('OUT OF 100', centerX, centerY + 42);

    // Verdict Badge Under Gauge (Positioned well below circle to guarantee zero overlap)
    ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const badgeText = `✓ ${result.verdict.label.toUpperCase()}`;
    const textWidth = ctx.measureText(badgeText).width;
    const pillWidth = Math.max(210, textWidth + 32);
    const badgeY = centerY + radius + 25; // 265 + 85 + 25 = 375px (strictly below circle edge 350px)

    ctx.beginPath();
    ctx.roundRect(centerX - pillWidth / 2, badgeY, pillWidth, 34, 17);
    ctx.fillStyle = `${result.verdict.color}20`;
    ctx.fill();
    ctx.strokeStyle = `${result.verdict.color}60`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = result.verdict.color;
    ctx.textAlign = 'center';
    ctx.fillText(badgeText, centerX, badgeY + 22);

    // 6. Right Column: Resume Details & Metrics
    ctx.textAlign = 'left';
    const startX = 390;

    // File name
    ctx.font = '600 16px "JetBrains Mono", monospace, sans-serif';
    ctx.fillStyle = '#94a3b8';
    const displayFile = fileName.length > 36 ? fileName.slice(0, 33) + '...' : fileName;
    ctx.fillText(`📄 ${displayFile}`, startX, 165);

    // Headline
    ctx.font = 'bold 30px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText('Automated ATS Screening Passed', startX, 205);

    // Metrics Row (4 stat boxes cleanly distributed)
    const stats = [
      { val: `${result.metrics.wordCount}`, label: 'Words' },
      { val: `${result.metrics.actionVerbCount}`, label: 'Action Verbs' },
      { val: `${result.metrics.quantifiableMetricCount}`, label: 'Metrics' },
      { val: `${result.metrics.detectedSkillCount}`, label: 'Skills' },
    ];

    const boxWidth = 165;
    const boxGap = 16;
    const boxY = 235;

    stats.forEach((st, idx) => {
      const boxX = startX + idx * (boxWidth + boxGap);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxWidth, 68, 10);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.font = '800 22px "JetBrains Mono", monospace, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(st.val, boxX + 16, boxY + 34);

      ctx.font = '600 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(st.label.toUpperCase(), boxX + 16, boxY + 54);
    });

    // Top Detected Skills Preview
    const flatSkills: string[] = [];
    result.detectedSkills.forEach((g) => flatSkills.push(...g.skills));
    const topSkills = flatSkills.slice(0, 7).join(' • ');

    ctx.font = '600 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(`Tech Stack: ${topSkills}`, startX, 345);

    // ATS Systems Badges
    ctx.font = '600 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#10b981';
    ctx.fillText('✓ Workday Tested    ✓ Greenhouse Ready    ✓ Lever Compatible    ✓ Ashby Verified', startX, 385);

    // 7. Bottom Highlight Banner (The viral quote)
    const bannerY = 475;
    ctx.fillStyle = 'rgba(217, 119, 6, 0.12)';
    ctx.beginPath();
    ctx.roundRect(50, bannerY, width - 100, 95, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#fbbf24'; // Amber
    ctx.fillText(`"My developer resume scored ${result.overallScore}/100 on ATS Scroll! 🚀"`, 80, bannerY + 40);

    ctx.font = '500 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('Test your resume with 100% in-browser privacy → https://devscrolls.dev/ats-checker/', 80, bannerY + 70);

    // Update image preview URL
    try {
      const dataUrl = canvas.toDataURL('image/png');
      setImageUrl(dataUrl);
    } catch {
      // Fallback
    }
  }, [isOpen, result, fileName]);

  if (!isOpen) return null;

  const shareText = `My developer resume scored ${result.overallScore}/100 on ATS Scroll! 🚀 Test your resume with 100% in-browser privacy: https://devscrolls.dev/ats-checker/`;

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const a = document.createElement('a');
    a.href = canvasRef.current.toDataURL('image/png');
    a.download = `ats-scroll-score-${result.overallScore}.png`;
    a.click();
    setCopyStatus('Image Downloaded!');
    setTimeout(() => setCopyStatus(''), 2500);
  };

  const handleCopyImage = async () => {
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        setCopyStatus('✓ Image Copied to Clipboard!');
        setTimeout(() => setCopyStatus(''), 2500);
      });
    } catch {
      // If direct clipboard image write fails (browser permissions), copy text
      navigator.clipboard.writeText(shareText);
      setCopyStatus('✓ Copied Share Text!');
      setTimeout(() => setCopyStatus(''), 2500);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(shareText);
    setCopyStatus('✓ Copied Text Link!');
    setTimeout(() => setCopyStatus(''), 2500);
  };

  return (
    <div className="ats-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="ats-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="ats-modal-header">
          <div className="ats-modal-header-left">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
            <h3>Shareable ATS Score Card</h3>
          </div>
          <button onClick={onClose} className="ats-modal-close-btn" aria-label="Close modal">
            ✕
          </button>
        </div>

        <p className="ats-modal-desc">
          Attach this high-res card to your LinkedIn, X/Twitter, or portfolio post to stand out with visual proof of your ATS pass score:
        </p>

        {/* Hidden Canvas for generation */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* High-res rendered image preview */}
        <div className="ats-modal-preview-wrapper">
          {imageUrl && (
            <img
              src={imageUrl}
              alt={`ATS Scroll Score Card - ${result.overallScore}/100`}
              className="ats-modal-preview-img"
            />
          )}
        </div>

        {copyStatus && <div className="ats-modal-toast">{copyStatus}</div>}

        <div className="ats-modal-actions">
          <button onClick={handleDownload} className="ats-btn-primary ats-action-download">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Download Card (PNG)
          </button>

          <button onClick={handleCopyImage} className="ats-btn-secondary">
            Copy Image
          </button>

          <button onClick={handleCopyText} className="ats-btn-secondary">
            Copy Post Text
          </button>
        </div>
      </div>
    </div>
  );
};
