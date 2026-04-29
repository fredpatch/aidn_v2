import { useReducedMotion, type Easing } from 'framer-motion';

type MotionState = Record<string, number | string>;

export interface SafeMotionVariants {
  fade: {
    initial?: MotionState;
    animate?: MotionState;
    exit?: MotionState;
  };
  slideUp: {
    initial?: MotionState;
    animate?: MotionState;
    exit?: MotionState;
  };
  scaleIn: {
    initial?: MotionState;
    animate?: MotionState;
    exit?: MotionState;
  };
  staggerDelay: number;
  transition: {
    duration: number;
    ease: Easing;
  };
}

export function useSafeMotion(): SafeMotionVariants {
  const shouldReduce = useReducedMotion();

  if (shouldReduce) {
    return {
      fade: {},
      slideUp: {},
      scaleIn: {},
      staggerDelay: 0,
      transition: { duration: 0, ease: 'linear' as const },
    };
  }

  return {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    slideUp: {
      initial: { opacity: 0, y: 8 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -4 },
    },
    scaleIn: {
      initial: { opacity: 0, scale: 0.96 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.96 },
    },
    staggerDelay: 0.05,
    transition: { duration: 0.15, ease: 'easeOut' as const },
  };
}
