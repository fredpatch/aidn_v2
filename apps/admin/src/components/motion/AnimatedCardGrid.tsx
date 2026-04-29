import { motion } from 'framer-motion';
import { Children } from 'react';
import { useSafeMotion } from '@/hooks/useSafeMotion';

interface AnimatedCardGridProps {
  children: React.ReactNode;
  className?: string;
}

const STAGGER_CAP = 8;

export function AnimatedCardGrid({ children, className }: AnimatedCardGridProps): React.JSX.Element {
  const { slideUp, staggerDelay, transition } = useSafeMotion();
  const items = Children.toArray(children);

  return (
    <div className={className}>
      {items.map((child, index) => (
        <motion.div
          key={index}
          initial={slideUp.initial}
          animate={slideUp.animate}
          transition={{
            ...transition,
            delay: index < STAGGER_CAP ? index * staggerDelay : 0,
          }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
}
