import { NavLink } from 'react-router-dom';
import clsx from 'clsx';

interface NavLinkItemProps {
  to: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

export function NavLinkItem({ to, label, icon, onClick }: NavLinkItemProps): React.JSX.Element {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
        )
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}
