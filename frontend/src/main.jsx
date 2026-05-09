import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext.jsx'
import ErrorBoundary from './components/ui/ErrorBoundary.jsx'
import App from './App.jsx'
import './index.css'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
)