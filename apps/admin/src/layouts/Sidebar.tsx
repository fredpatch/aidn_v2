import { X } from 'lucide-react';
import clsx from 'clsx';
import { NavGroup } from '../components/nav/NavGroup';
import { NavLinkItem } from '../components/nav/NavLinkItem';
import { APP_NAME } from '../config/app';
import { NAV_GROUPS } from '../config/nav';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

function SidebarPanel({ onClose }: Pick<SidebarProps, 'onClose'>): React.JSX.Element {
  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-10 w-10 place-items-center overflow-hidden rounded-md bg-white ring-1 ring-border">
            <img className="h-9 w-9 object-contain" src="/logo.png" alt="" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-950 dark:text-white">{APP_NAME}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Navigabilité</p>
          </div>
        </div>
        <button className="btn btn-secondary h-9 w-9 p-0 md:hidden" type="button" onClick={onClose} aria-label="Close navigation">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <nav className="flex-1 space-y-3 overflow-y-auto p-3">
        {NAV_GROUPS.map((group) => (
          <NavGroup key={group.storageKey} label={group.label} storageKey={group.storageKey} paths={group.items.map((item) => item.to)}>
            {group.items.map((item) => (
              <NavLinkItem key={item.to} to={item.to} label={item.label} icon={item.icon} onClick={onClose} />
            ))}
          </NavGroup>
        ))}
      </nav>
    </aside>
  );
}

export function Sidebar({ open, onClose }: SidebarProps): React.JSX.Element {
  return (
    <>
      <div className="fixed inset-y-0 left-0 z-40 hidden md:block">
        <SidebarPanel onClose={onClose} />
      </div>

      <div className={clsx('fixed inset-0 z-50 md:hidden', open ? 'pointer-events-auto' : 'pointer-events-none')} aria-hidden={!open}>
        <button
          type="button"
          className={clsx(
            'absolute inset-0 bg-slate-950/40 transition-opacity',
            open ? 'opacity-100' : 'opacity-0',
          )}
          onClick={onClose}
          aria-label="Close navigation backdrop"
        />
        <div
          className={clsx(
            'relative h-full w-64 transition-transform duration-200',
            open ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <SidebarPanel onClose={onClose} />
        </div>
      </div>
    </>
  );
}
