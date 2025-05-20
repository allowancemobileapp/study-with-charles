
"use client";

import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div style={{ padding: '20px', margin: '20px auto', maxWidth: '800px', border: '1px solid #ff4d4f', borderRadius: '8px', backgroundColor: '#fff1f0', color: '#cf1322' }}>
          <h1 style={{ fontSize: '1.5em', marginBottom: '10px' }}>Oops! Something went wrong.</h1>
          <p style={{ marginBottom: '15px' }}>We're sorry for the inconvenience. Please try refreshing the page, or contact support if the problem persists.</p>
          {this.state.error && (
            <details style={{ marginTop: '15px', whiteSpace: 'pre-wrap', textAlign: 'left', background: '#ffffff', padding: '10px', border: '1px dashed #d9d9d9', borderRadius: '4px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Error Details</summary>
              <p><strong>Message:</strong> {this.state.error.toString()}</p>
              {this.state.errorInfo && this.state.errorInfo.componentStack && (
                <p style={{ marginTop: '5px' }}><strong>Component Stack:</strong> {this.state.errorInfo.componentStack}</p>
              )}
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
