import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('[AgriOS ErrorBoundary]:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column', gap: 16, padding: 40 }}>
          <h1 style={{ color: 'var(--color-danger)' }}>Something went wrong</h1>
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', maxWidth: 600 }}>
            AgriOS encountered an unexpected runtime error. Please refresh the page or contact support.
          </p>
          <details style={{ textAlign: 'left', maxWidth: 700, background: 'rgba(0,0,0,0.3)', padding: 16, borderRadius: 8 }}>
            <summary style={{ cursor: 'pointer', marginBottom: 8 }}>Error Details</summary>
            <pre style={{ overflow: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {this.state.error && this.state.error.toString()}
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </pre>
          </details>
          <button className="btn btn-primary" onClick={this.handleReset}>Try Again</button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
