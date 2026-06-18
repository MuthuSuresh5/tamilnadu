import { Component } from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) console.error('ErrorBoundary:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={28} className="text-[#D32F2F]" />
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">Something went wrong</h2>
            <p className="text-sm text-gray-500 mb-5">
              {this.state.error?.message || 'An unexpected error occurred. Please try again.'}
            </p>
            {import.meta.env.DEV && this.state.error?.stack && (
              <p className="text-xs text-gray-400 bg-gray-50 rounded-xl p-3 mb-5 text-left font-mono break-all">
                {this.state.error.stack.split('\n')[0]}
              </p>
            )}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#D32F2F] text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-all"
              >
                <RefreshCw size={15} /> Try Again
              </button>
              <a href="/"
                className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-all"
              >
                <Home size={15} /> Go Home
              </a>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
