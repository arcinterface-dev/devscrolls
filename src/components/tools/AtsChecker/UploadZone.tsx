import React, { useState, useRef } from 'react';

interface UploadZoneProps {
  onFileSelected: (file: File) => void;
  onLoadSample: () => void;
  isLoading: boolean;
  errorMessage?: string | null;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onFileSelected,
  onLoadSample,
  isLoading,
  errorMessage,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      onFileSelected(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      onFileSelected(file);
    }
  };

  return (
    <div className="ats-upload-container">
      <div
        className={`ats-dropzone ${isDragOver ? 'is-drag-over' : ''} ${isLoading ? 'is-loading' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isLoading && fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload your resume to check ATS score"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="ats-hidden-file-input"
          onChange={handleFileInputChange}
          disabled={isLoading}
        />

        <div className="ats-dropzone-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
        </div>

        <h3 className="ats-dropzone-heading">
          Drop your resume here, or <span className="ats-browse-highlight">browse files</span>
        </h3>

        <p className="ats-dropzone-sub">
          Supports text-based <strong>PDF</strong> and <strong>DOCX</strong> files up to 10MB.
        </p>

        <div className="ats-format-tags">
          <span className="ats-format-pill">PDF (.pdf)</span>
          <span className="ats-format-pill">Word (.docx)</span>
          <span className="ats-format-pill">≤ 10MB</span>
        </div>
      </div>

      {errorMessage && (
        <div className="ats-error-banner" role="alert">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <div>
            <strong>Parsing Error:</strong> {errorMessage}
          </div>
        </div>
      )}

      {/* Privacy Notice Banner */}
      <div className="ats-privacy-guarantee">
        <div className="ats-privacy-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            <polyline points="9 12 11 14 15 10"></polyline>
          </svg>
        </div>
        <div className="ats-privacy-text">
          <strong>100% In-Browser Privacy:</strong> Your resume never leaves your computer. File parsing and scoring execute strictly inside your browser using client-side Web Workers. Zero bytes of your resume or personal details are uploaded to any server.
        </div>
      </div>

      {/* Try Demo Resume Button */}
      <div className="ats-demo-row">
        <span>Don't have your resume on hand?</span>
        <button type="button" className="ats-demo-btn" onClick={onLoadSample} disabled={isLoading}>
          Test with Sample Senior Frontend Resume →
        </button>
      </div>
    </div>
  );
};
