import { useEffect, useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { STORAGE_PREFIX } from '../../config/app';

interface NavGroupProps {
  label: string;
  storageKey: string;
  children: React.ReactNode;
  paths: string[];
}

export function NavGroup({ label, storageKey, children, paths }: NavGroupProps): React.JSX.Element {
  const location = useLocation();
  const localStorageKey = useMemo(() => `${STORAGE_PREFIX}.sidebar.navGroups.${storageKey}`, [storageKey]);
  const [isOpen, setIsOpen] = useState(() => localStorage.getItem(localStorageKey) !== 'false');
  const containsActiveRoute = paths.some((path) => location.pathname === path);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (containsActiveRoute) {
      setIsOpen(true);
      localStorage.setItem(localStorageKey, 'true');
    }
  }, [containsActiveRoute, localStorageKey]);

  const handleToggle = () => {
    setIsOpen((current) => {
      const next = !current;
      localStorage.setItem(localStorageKey, String(next));
      return next;
    });
  };

  return (
    <section className="space-y-1">
      <button
        type="button"
        className="flex w-full items-center justify-between rounded-md px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        onClick={handleToggle}
        aria-expanded={isOpen}
      >
        <span>{label}</span>
        <ChevronDown className={clsx('h-4 w-4 transition-transform duration-200 ease-out', isOpen && 'rotate-180')} aria-hidden="true" />
      </button>
      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            key="items"
            initial={shouldReduceMotion ? false : { height: 0, opacity: 0 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' as const }}
            className="overflow-hidden"
          >
            <div className="space-y-1 pt-1">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
