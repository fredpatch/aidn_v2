import { motion } from 'framer-motion';
import { useSafeMotion } from '@/hooks/useSafeMotion';

interface AnimatedFadeInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function AnimatedFadeIn({ children, className, delay = 0 }: AnimatedFadeInProps): React.JSX.Element {
  const { fade, transition } = useSafeMotion();

  return (
    <motion.div className={className} initial={fade.initial} animate={fade.animate} transition={{ ...transition, delay }}>
      {children}
    </motion.div>
  );
}
