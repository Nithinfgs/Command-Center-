import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught simulation error in ErrorBoundary:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 h-full flex flex-col items-center justify-center p-6 bg-[#090A0D] text-[#E6E8EB] select-none">
          <div className="bg-[#151820] border border-[#D95757]/40 rounded-xl p-6 max-w-md w-full shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#D95757]/15 border border-[#D95757]/30 flex items-center justify-center mx-auto text-[#D95757]">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[#E6E8EB]">
                {this.props.fallbackTitle || 'Simulation Module Error'}
              </h2>
              <p className="text-xs text-[#A4ABB6] mt-1">
                An unexpected calculation or rendering exception occurred.
              </p>
            </div>
            {this.state.error && (
              <div className="bg-[#0E1015] p-2.5 rounded border border-[#252B36] text-[11px] font-mono-num text-[#D95757] text-left truncate">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="px-4 py-2 rounded-lg bg-[#FF8A1F] hover:bg-[#FFA24A] text-[#090A0D] font-semibold text-xs flex items-center justify-center gap-2 mx-auto transition-all shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Recover Module</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
