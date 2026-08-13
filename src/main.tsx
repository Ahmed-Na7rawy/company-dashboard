import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { ToastProvider } from './components/ToastProvider';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '24px',
          background: '#fef2f2',
          color: '#991b1b',
          fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
          border: '2px solid #f87171',
          borderRadius: '16px',
          margin: '32px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: '900' }}>⚠️ Application Rendering Crash Detected</h2>
          <p style={{ fontSize: '14px', margin: '0 0 16px 0' }}>Please copy this error report and send it to the developer to resolve the issue:</p>
          <details open style={{ outline: 'none' }}>
            <summary style={{ fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', margin: '0 0 8px 0', textDecoration: 'underline' }}>Error Details</summary>
            <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #fee2e2', overflowX: 'auto', fontSize: '12px', lineHeight: '1.5' }}>
              <strong>Message:</strong> {this.state.error && this.state.error.toString()}
              <br /><br />
              <strong>Stack Trace:</strong>
              <pre style={{ margin: '8px 0 0 0', whiteSpace: 'pre-wrap', color: '#dc2626' }}>{this.state.error && this.state.error.stack}</pre>
              {this.state.errorInfo && (
                <>
                  <br />
                  <strong>Component Stack:</strong>
                  <pre style={{ margin: '8px 0 0 0', whiteSpace: 'pre-wrap', color: '#4b5563' }}>{this.state.errorInfo.componentStack}</pre>
                </>
              )}
            </div>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

if (import.meta.env.DEV) {
  import('@axe-core/react').then((axe) => {
    axe.default(React, createRoot, 1000);
  }).catch((err) => console.error('Axe core initialization error:', err));
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ToastProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </ToastProvider>
  </React.StrictMode>,
);
