import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

interface UseAppSplashOptions {
  enabled: boolean;
  minDisplayMs: number;
  maxDisplayMs: number;
}

interface UseAppSplashResult {
  isVisible: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  brandRef: React.RefObject<HTMLDivElement | null>;
  progressRef: React.RefObject<HTMLDivElement | null>;
  complete: () => void;
}

export function useAppSplash({ enabled, minDisplayMs, maxDisplayMs }: UseAppSplashOptions): UseAppSplashResult {
  const [isVisible, setIsVisible] = useState(enabled);
  const containerRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const mountedAtRef = useRef(Date.now());
  const hasExitStartedRef = useRef(false);
  const reducedMotionRef = useRef(false);
  const enterTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const timeoutIdsRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timeoutIdsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    timeoutIdsRef.current = [];
  }, []);

  const setTimer = useCallback((callback: () => void, delay: number) => {
    const timeoutId = window.setTimeout(callback, delay);
    timeoutIdsRef.current.push(timeoutId);
    return timeoutId;
  }, []);

  const complete = useCallback(() => {
    if (!enabled || hasExitStartedRef.current) return;

    hasExitStartedRef.current = true;
    const elapsedMs = Date.now() - mountedAtRef.current;
    const remainingMs = Math.max(0, minDisplayMs - elapsedMs);

    setTimer(() => {
      const container = containerRef.current;
      if (!container) {
        setIsVisible(false);
        return;
      }

      enterTimelineRef.current?.kill();

      if (reducedMotionRef.current) {
        container.style.opacity = '0';
        setTimer(() => setIsVisible(false), 160);
        return;
      }

      const progressBar = container.querySelector('[data-splash-progress-bar]');
      const dots = container.querySelectorAll('[data-splash-dot]');

      gsap.killTweensOf([container, brandRef.current, progressRef.current, progressBar, ...dots]);
      gsap
        .timeline({ onComplete: () => setIsVisible(false) })
        .to(progressRef.current, { opacity: 0, y: -6, duration: 0.18, ease: 'power2.inOut' })
        .to(brandRef.current, { opacity: 0, y: -10, scale: 0.98, duration: 0.22, ease: 'power2.inOut' }, '<')
        .to(container, { opacity: 0, duration: 0.28, ease: 'power2.inOut' }, '-=0.05');
    }, remainingMs);
  }, [enabled, minDisplayMs, setTimer]);

  useEffect(() => {
    if (!enabled) {
      setIsVisible(false);
      return undefined;
    }

    mountedAtRef.current = Date.now();
    hasExitStartedRef.current = false;
    reducedMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setTimer(complete, maxDisplayMs);

    if (reducedMotionRef.current) {
      return () => {
        clearTimers();
      };
    }

    const context = gsap.context(() => {
      const progressBar = containerRef.current?.querySelector('[data-splash-progress-bar]');
      const dots = Array.from(containerRef.current?.querySelectorAll('[data-splash-dot]') ?? []);

      enterTimelineRef.current = gsap
        .timeline()
        .fromTo(containerRef.current, { opacity: 0 }, { opacity: 1, duration: 0.18, ease: 'power2.out' })
        .fromTo(brandRef.current, { opacity: 0, y: 12, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.42, ease: 'power3.out' }, '-=0.04')
        .fromTo(progressRef.current, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.28, ease: 'power2.out' }, '-=0.18');

      if (progressBar) {
        gsap.fromTo(progressBar, { scaleX: 0.14 }, { scaleX: 1, duration: 1.2, ease: 'power2.inOut', repeat: -1, yoyo: true });
      }

      if (dots.length > 0) {
        gsap.fromTo(dots, { y: 0, opacity: 0.45 }, { y: -4, opacity: 1, stagger: 0.12, duration: 0.42, ease: 'sine.inOut', repeat: -1, yoyo: true });
      }
    }, containerRef);

    return () => {
      clearTimers();
      enterTimelineRef.current?.kill();
      context.revert();
    };
  }, [clearTimers, complete, enabled, maxDisplayMs, setTimer]);

  return {
    isVisible,
    containerRef,
    brandRef,
    progressRef,
    complete,
  };
}
