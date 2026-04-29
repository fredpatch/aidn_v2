import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import './index.css';
import App from './App';
import { AppSplashScreen } from './components/branding/AppSplashScreen';
import { MotionWrapper } from './components/motion/MotionWrapper';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { useAuth } from './hooks/useAuth';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppRoot(): React.JSX.Element {
  const { isLoading } = useAuth();

  return (
    <>
      <App />
      <AppSplashScreen isAppReady={!isLoading} />
      <Toaster position="top-right" richColors />
    </>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <MotionWrapper>
        <BrowserRouter>
          <AuthProvider>
            <QueryClientProvider client={queryClient}>
              <AppRoot />
            </QueryClientProvider>
          </AuthProvider>
        </BrowserRouter>
      </MotionWrapper>
    </ThemeProvider>
  </StrictMode>,
);
