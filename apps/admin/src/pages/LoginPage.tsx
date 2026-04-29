import type { FormEvent } from 'react';
import { APP_NAME } from '../config/app';
import { useAuth } from '../hooks/useAuth';

export function LoginPage(): React.JSX.Element {
  const { login } = useAuth();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // TODO: replace with real auth API call.
    login('aidn-demo-token');
  };

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4 py-10 dark:bg-slate-950">
      <section className="surface w-full max-w-sm rounded-lg p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center overflow-hidden rounded-md bg-white ring-1 ring-border">
            <img className="h-10 w-10 object-contain" src="/logo.png" alt="" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-950 dark:text-white">{APP_NAME}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Direction de la Navigabilité</p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Email
            <input className="control mt-1 w-full" type="email" defaultValue="agent@aidn.local" required />
          </label>

          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Mot de passe
            <input className="control mt-1 w-full" type="password" defaultValue="password" required />
          </label>

          <button className="btn btn-primary w-full" type="submit">
            Se connecter
          </button>
        </form>
      </section>
    </main>
  );
}
