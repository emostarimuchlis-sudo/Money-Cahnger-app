import React from 'react';
import { RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#064E3B] to-[#022C22]">
          <div className="text-center p-8 max-w-md">
            <div className="text-red-400 text-6xl mb-4">❌</div>
            <h2 className="text-[#D4AF37] text-2xl mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              Terjadi Kesalahan
            </h2>
            <p className="text-[#FEF3C7]/70 mb-6">
              Aplikasi mengalami masalah. Silakan muat ulang halaman.
            </p>
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#D4AF37] text-[#064E3B] rounded-lg font-semibold hover:bg-[#B8963A] transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              Muat Ulang
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
