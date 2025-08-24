
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/auth-context";
import { RealtimeProvider } from "@/contexts/realtime-context";
import { OfflineProvider } from "@/contexts/offline-context";
import { useRoutes } from "react-router-dom";
import routes from "./routes";
import { useState, useEffect, Suspense } from "react";
import { LazyLoadErrorBoundary } from "@/components/LazyLoadErrorBoundary";

// Handle chunk loading errors globally
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('Loading chunk') || 
      event.reason?.message?.includes('Failed to fetch dynamically imported module')) {
    console.error('Chunk loading error detected, reloading page:', event.reason);
    window.location.reload();
  }
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60, // 1 hour
      retry: 1,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchOnReconnect: true,
    },
  },
});

function AppRoutes() {
  const routeElements = useRoutes(routes);
  return (
    <LazyLoadErrorBoundary>
      <Suspense fallback={
        <div className="flex items-center justify-center h-screen">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p>Loading...</p>
          </div>
        </div>
      }>
        {routeElements}
      </Suspense>
    </LazyLoadErrorBoundary>
  );
}

function App() {
  const [showDevTools, setShowDevTools] = useState(false);

  useEffect(() => {
    console.log('App initializing...');
    
    const urlParams = new URLSearchParams(window.location.search);
    const devToolsParam = urlParams.get('devtools');
    
    const savedPreference = localStorage.getItem('showReactQueryDevTools');
    
    if (devToolsParam === 'true' || savedPreference === 'true') {
      setShowDevTools(true);
      localStorage.setItem('showReactQueryDevTools', 'true');
    }
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && event.shiftKey && event.key === 'D') {
        setShowDevTools(prev => {
          const newValue = !prev;
          localStorage.setItem('showReactQueryDevTools', newValue ? 'true' : 'false');
          return newValue;
        });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <RealtimeProvider>
          <OfflineProvider>
            <AuthProvider>
              <AppRoutes />
              <Toaster />
            </AuthProvider>
          </OfflineProvider>
        </RealtimeProvider>
        {showDevTools && <ReactQueryDevtools initialIsOpen={false} />}
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
