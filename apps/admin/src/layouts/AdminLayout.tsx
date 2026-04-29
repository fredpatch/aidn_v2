import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Footer } from './Footer';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { PageTransition } from '../components/layout/PageTransition';

export function AdminLayout(): React.JSX.Element {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.classList.toggle('overflow-hidden', sidebarOpen);
    return () => document.body.classList.remove('overflow-hidden');
  }, [sidebarOpen]);

  return (
    <div className="h-screen overflow-hidden bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex h-full flex-col md:pl-64">
        <Header onMenuToggle={() => setSidebarOpen((open) => !open)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <PageTransition />
        </main>
        <Footer />
      </div>
    </div>
  );
}
