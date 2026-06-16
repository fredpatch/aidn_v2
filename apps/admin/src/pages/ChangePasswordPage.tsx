import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function ChangePasswordPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { changePassword, loadCurrentUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Le nouveau mot de passe doit contenir au moins 8 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('La confirmation ne correspond pas au nouveau mot de passe.');
      return;
    }

    setIsSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      await loadCurrentUser();
      navigate('/dashboard', { replace: true });
    } catch {
      setError('Connexion impossible.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4 py-10 dark:bg-slate-950">
      <section className="surface w-full max-w-md rounded-lg p-6">
        <div className="mb-5">
          <h1 className="text-xl font-bold text-slate-950 dark:text-white">Changer le mot de passe</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Votre compte AIDN necessite un changement de mot de passe avant de continuer.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Mot de passe actuel
            <input className="control mt-1 w-full" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />
          </label>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Nouveau mot de passe
            <input className="control mt-1 w-full" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
          </label>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Confirmer le nouveau mot de passe
            <input className="control mt-1 w-full" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
          </label>

          {error ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </p>
          ) : null}

          <button className="btn btn-primary w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </form>
      </section>
    </main>
  );
}
