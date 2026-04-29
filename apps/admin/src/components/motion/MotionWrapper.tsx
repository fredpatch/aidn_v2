import { MotionConfig } from 'framer-motion';

interface MotionWrapperProps {
  children: React.ReactNode;
}

// framer-motion bundle: app bundle gzip increased by ~40 KB in this Vite build.
export function MotionWrapper({ children }: MotionWrapperProps): React.JSX.Element {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
