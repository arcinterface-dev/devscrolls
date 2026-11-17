import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ATS Scroll ErrorBoundary caught an error]', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="ats-tool-wrapper">
          <div className="ats-error-banner" style={{ margin: '40px auto', maxWidth: '640px', padding: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem' }}>ATS Scanner Encountered an Issue</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                {this.state.error?.message || 'A client-side initialization error occurred.'}
              </p>
            </div>
            <button
              onClick={this.handleReset}
              className="ats-btn-primary"
              style={{ marginTop: '8px' }}
            >
              Reset Scanner
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
