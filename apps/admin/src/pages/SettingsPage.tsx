import { useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import clsx from 'clsx';
import { AVAILABLE_PALETTES, APP_ENV, APP_NAME, APP_VERSION, DATA_MODE, MOCK_LATENCY_MS } from '../config/app';
import { FEATURES } from '../config/features';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme, type Palette, type Theme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

type EnvBadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive';

const themeOptions: { value: Theme; label: string; icon: React.ReactNode }[] = [
  { value: 'system', label: 'Système', icon: <Monitor className="h-4 w-4" aria-hidden="true" /> },
  { value: 'light', label: 'Clair', icon: <Sun className="h-4 w-4" aria-hidden="true" /> },
  { value: 'dark', label: 'Sombre', icon: <Moon className="h-4 w-4" aria-hidden="true" /> },
];

const themeLabels: Record<Theme | 'light' | 'dark', string> = {
  system: 'Système',
  light: 'Clair',
  dark: 'Sombre',
};

const paletteColors: Record<Palette, string> = {
  aidn: 'bg-[linear-gradient(135deg,#40387f_0_45%,#009b4a_45%_62%,#f4e83a_62%_78%,#4d61a8_78%)]',
  aviation: 'bg-[#4d61a8]',
  gabon: 'bg-[linear-gradient(180deg,#009b4a_0_33%,#f4e83a_33%_66%,#4d61a8_66%)]',
  neutral: 'bg-[#514d68]',
};

const paletteLabels: Record<Palette, string> = {
  aidn: 'AIDN',
  aviation: 'Aviation',
  gabon: 'Gabon',
  neutral: 'Neutre',
};

export function AppearanceSection(): React.JSX.Element {
  const { theme, setTheme, palette, setPalette, resolvedTheme } = useTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Apparence</CardTitle>
        <p className="text-sm text-slate-500 dark:text-slate-400">Choisir l’affichage de AIDN sur ce poste.</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">Thème</p>
            <Badge variant="outline">Résolu : {themeLabels[resolvedTheme]}</Badge>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Mode de thème">
            {themeOptions.map((option) => (
              <Button
                key={option.value}
                type="button"
                size="sm"
                variant={theme === option.value ? 'default' : 'outline'}
                onClick={() => setTheme(option.value)}
              >
                {option.icon}
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Couleur</p>
          <div className="flex flex-wrap gap-3">
            {AVAILABLE_PALETTES.map((availablePalette) => (
              <button
                key={availablePalette}
                type="button"
                onClick={() => setPalette(availablePalette)}
                title={`Palette ${paletteLabels[availablePalette]}`}
                className={cn(
                  'h-8 w-8 rounded-full border-2 transition-transform',
                  paletteColors[availablePalette],
                  palette === availablePalette ? 'scale-110 border-foreground ring-2 ring-ring ring-offset-2 ring-offset-background' : 'border-transparent hover:scale-105',
                )}
                aria-pressed={palette === availablePalette}
                aria-label={`Palette ${paletteLabels[availablePalette]}`}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getEnvVariant(env: string): EnvBadgeVariant {
  switch (env) {
    case 'production':
      return 'default';
    case 'staging':
      return 'secondary';
    case 'development':
    case 'local':
    default:
      return 'outline';
  }
}

function CopyVersionButton({ version }: { version: string }): React.JSX.Element {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(version);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be unavailable in some browser contexts.
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      type="button"
      onClick={() => void handleCopy()}
      aria-label="Copy version"
      title={copied ? 'Copied' : 'Copy version'}
      className="h-6 w-6"
    >
      <span className="text-xs">{copied ? 'OK' : 'CP'}</span>
    </Button>
  );
}

export function SystemSection(): React.JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Système</CardTitle>
        <p className="text-sm text-slate-500 dark:text-slate-400">Informations techniques en lecture seule.</p>
      </CardHeader>
      <CardContent>
        <dl className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-sm text-muted-foreground">Application</dt>
            <dd className="text-sm font-medium">{APP_NAME}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-sm text-muted-foreground">Version</dt>
            <dd className="flex items-center gap-2">
              <Badge variant="outline">{APP_VERSION}</Badge>
              <CopyVersionButton version={APP_VERSION} />
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-sm text-muted-foreground">Environnement</dt>
            <dd>
              <Badge variant={getEnvVariant(APP_ENV)}>{APP_ENV}</Badge>
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}

export function SettingsPage(): React.JSX.Element {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Paramètres</h1>
          <p className="page-subtitle">Configurer les préférences du prototype AIDN.</p>
        </div>
      </div>
      <AppearanceSection />
      <DataModeSection />
      <FeatureFlagsSection />
      <SystemSection />
    </div>
  );
}

function DataModeSection(): React.JSX.Element {
  return (
    <section className="surface rounded-lg p-4">
      <div className="mb-4">
        <h2 className="text-base font-bold text-slate-950 dark:text-white">Mode de données</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Comportement actuel de la source de données frontend.</p>
      </div>
      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-600 dark:text-slate-300">Mode actuel</span>
          <span className={clsx('rounded px-2 py-0.5 text-xs font-bold', DATA_MODE === 'mock' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200')}>
            {DATA_MODE}
          </span>
        </div>
        {DATA_MODE === 'mock' ? (
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-600 dark:text-slate-300">Latence mock</span>
            <span className="font-semibold">{MOCK_LATENCY_MS}ms</span>
          </div>
        ) : null}
        <p className="text-xs text-slate-400">Changer de mode avec VITE_DATA_MODE dans le fichier d’environnement local.</p>
      </div>
    </section>
  );
}

function FeatureFlagsSection(): React.JSX.Element {
  return (
    <section className="surface rounded-lg p-4">
      <div className="mb-4">
        <h2 className="text-base font-bold text-slate-950 dark:text-white">Fonctionnalités</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Registre frontend statique des sections du prototype.</p>
      </div>
      <div className="space-y-2">
        {Object.entries(FEATURES).map(([key, feature]) => (
          <div key={key} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-slate-700 dark:text-slate-200">{feature.label}</span>
            <span className={clsx('rounded px-2 py-0.5 text-xs font-bold', feature.enabled ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300')}>
              {feature.enabled ? 'Activée' : 'Désactivée'}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
