import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
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
    console.error('Yozigo Uncaught UI Exception:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.hash = '#/';
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#101110] text-[#F4EFE6] flex items-center justify-center p-6 select-none">
          <div className="max-w-md w-full bg-[#191A18] border border-[#34332F] rounded-3xl p-8 flex flex-col items-center text-center shadow-2xl animate-fadeIn">
            <div className="w-16 h-16 rounded-2xl bg-[#823E46]/20 border border-[#823E46] flex items-center justify-center text-[#E47A75] mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>

            <span className="text-[10px] font-black uppercase tracking-widest text-[#F0A451]">
              System Diagnostics
            </span>
            <h2 className="text-2xl font-black text-[#F4EFE6] mt-1">Temporary Display Glitch</h2>
            <p className="text-xs text-[#B9B2A8] mt-2 leading-relaxed">
              An unexpected display glitch was caught safely by Yozigo's error boundary. Your data and seat reservations remain secure.
            </p>

            <div className="w-full mt-6 flex flex-col gap-2.5">
              <button
                onClick={this.handleReset}
                className="w-full py-3 px-5 rounded-xl bg-[#F0A451] hover:bg-[#FFB96B] active:scale-95 text-[#17120C] font-black text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Application</span>
              </button>

              <button
                onClick={() => {
                  window.location.hash = '#/';
                  this.setState({ hasError: false, error: null });
                }}
                className="w-full py-2.5 px-5 rounded-xl bg-[#101110] border border-[#34332F] hover:border-[#514B43] text-xs font-bold text-[#B9B2A8] hover:text-[#F4EFE6] transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Return to Catalog</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
