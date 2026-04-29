import { useEffect } from 'react';
import { BrandMark } from './BrandMark';
import { SplashProgress } from './SplashProgress';
import { useAppSplash } from '@/hooks/useAppSplash';
import { splashConfig } from '@/lib/branding/splash-config';

interface AppSplashScreenProps {
  isAppReady: boolean;
}

export function AppSplashScreen({ isAppReady }: AppSplashScreenProps): React.JSX.Element | null {
  const { isVisible, containerRef, brandRef, progressRef, complete } = useAppSplash(splashConfig);

  useEffect(() => {
    if (isAppReady) {
      complete();
    }
  }, [complete, isAppReady]);

  if (!isVisible) return null;

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-[100] grid place-items-center bg-background px-6 text-foreground"
      role="status"
      aria-live="polite"
      aria-label={`Chargement de ${splashConfig.appName}`}
    >
      <div className="flex w-full max-w-sm flex-col items-center gap-8">
        <div ref={brandRef}>
          <BrandMark appName={splashConfig.appName} tagline={splashConfig.tagline} subtitle={splashConfig.subtitle} />
        </div>
        <div ref={progressRef} className="w-full">
          <SplashProgress className="mx-auto" />
        </div>
      </div>
    </div>
  );
}
