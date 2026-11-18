import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'Ralat pangkalan data atau paparan telah berlaku.',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Application ErrorBoundary caught:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render() {
    if (this.state.hasError) {
      let friendly = 'Maaf, terdapat masalah semasa memproses data. Sila muat semula halaman.';
      try {
        const parsed = JSON.parse(this.state.errorMessage);
        if (parsed && typeof parsed.error === 'string') {
          friendly = parsed.error.includes('Missing or insufficient permissions')
            ? 'Akses pangkalan data memerlukan pengesahan penganjur yang sah.'
            : parsed.error;
        }
      } catch {
        if (this.state.errorMessage) {
          friendly = this.state.errorMessage;
        }
      }

      return (
        <div
          role="alert"
          className="mx-auto my-8 max-w-xl rounded-3xl border-2 border-[#e892b0] bg-[#fffdf7]/95 p-6 text-center shadow-lg"
        >
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#fdf2f7] text-[#8e1b42]">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h2 className="font-display text-lg font-semibold text-[#591d36]">
            Gangguan Sementara
          </h2>
          <p className="mt-2 text-sm text-[#591d36]/85 break-words">{friendly}</p>
          <button
            type="button"
            onClick={this.handleReset}
            className="btn-plum-silk mt-4 inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold text-[#fffdf7] cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Cuba Semula</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
