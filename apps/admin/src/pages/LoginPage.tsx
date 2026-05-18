import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_NAME } from '../config/app';
import { useAuth } from '../hooks/useAuth';

type LoginMode = 'bootstrap' | 'internal';

export function LoginPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { loginBootstrap, loginInternal } = useAuth();
  const [mode, setMode] = useState<LoginMode>('internal');
  const [email, setEmail] = useState('admin@aidn.local');
  const [matricule, setMatricule] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (mode === 'bootstrap') {
        await loginBootstrap(email, password);
        navigate('/dashboard', { replace: true });
        return;
      }

      const response = await loginInternal(matricule, password);
      navigate(response.requiresPasswordChange ? '/changer-mot-de-passe' : '/dashboard', { replace: true });
    } catch {
      setError('Identifiants invalides ou compte non active.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4 py-10 dark:bg-slate-950">
      <section className="surface w-full max-w-md rounded-lg p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center overflow-hidden rounded-md bg-white ring-1 ring-border">
            <img className="h-10 w-10 object-contain" src="/logo.png" alt="" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-950 dark:text-white">{APP_NAME}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Direction de la Navigabilite</p>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-2 rounded-md bg-slate-100 p-1 dark:bg-slate-800">
          <button
            className={`rounded-sm px-3 py-2 text-sm font-semibold ${mode === 'bootstrap' ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-950 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}
            type="button"
            onClick={() => setMode('bootstrap')}
          >
            Administrateur initial
          </button>
          <button
            className={`rounded-sm px-3 py-2 text-sm font-semibold ${mode === 'internal' ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-950 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}
            type="button"
            onClick={() => setMode('internal')}
          >
            Agent ANAC
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {mode === 'bootstrap' ? (
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Email
              <input className="control mt-1 w-full" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>
          ) : (
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Matricule
              <input className="control mt-1 w-full" value={matricule} onChange={(event) => setMatricule(event.target.value)} required />
            </label>
          )}

          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Mot de passe
            <input className="control mt-1 w-full" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>

          {error ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </p>
          ) : null}

          <button className="btn btn-primary w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </section>
    </main>
  );
}
