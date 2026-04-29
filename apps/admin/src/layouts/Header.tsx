import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, LogOut, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { APP_NAME } from '../config/app';
import { useAuth } from '../hooks/useAuth';

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps): React.JSX.Element {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [now, setNow] = useState(() => new Date());

  const dayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('fr-FR', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      }).format(now),
    [now],
  );

  const timeLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(now),
    [now],
  );

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(intervalId);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex min-w-0 items-center gap-3">
        <button className="btn btn-secondary h-10 w-10 p-0 md:hidden" type="button" onClick={onMenuToggle} aria-label="Ouvrir la navigation">
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="min-w-0">
          <p className="truncate text-sm text-slate-500 dark:text-slate-400">Direction de la Navigabilité</p>
          <h1 className="truncate text-lg font-bold text-slate-950 dark:text-white">{APP_NAME}</h1>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <div className="flex items-center gap-2 border-r border-slate-200 pr-3 text-right dark:border-slate-800">
          <CalendarClock className="hidden h-4 w-4 text-slate-400 sm:block" aria-hidden="true" />
          <time dateTime={now.toISOString()} className="leading-tight">
            <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">{timeLabel}</span>
            <span className="block text-xs text-slate-500 dark:text-slate-400">{dayLabel}</span>
          </time>
        </div>
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{user?.name ?? 'Agent DN'}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Suivi des dossiers OMA</p>
        </div>
        <button className="btn btn-secondary" type="button" onClick={handleLogout}>
          <LogOut className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Déconnexion</span>
        </button>
      </div>
    </header>
  );
}
