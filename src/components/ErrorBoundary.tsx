import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error?: Error; // Optional: store the error object if needed for display or logging
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: undefined,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can log the error to an error reporting service here
    console.error("Uncaught error in React component:", error, errorInfo);
    // Example: logErrorToMyService(error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="p-4 text-center text-red-600 bg-red-50 border border-red-300 rounded-md shadow-md">
          <h1 className="text-xl font-semibold mb-2">
            {this.props.fallbackMessage || "Oops! Something went wrong."}
          </h1>
          <p className="text-sm">
            We encountered an unexpected issue. Please try refreshing the page.
          </p>
          {/* Optionally, display more error details in development */}
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre className="mt-2 text-xs text-left whitespace-pre-wrap bg-red-100 p-2 rounded">
              {this.state.error.toString()}
              <br />
              {this.state.error.stack?.substring(0, 300)}...
              {/* Limit stack trace length for display */}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
