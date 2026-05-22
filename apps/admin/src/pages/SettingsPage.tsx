import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Monitor, Moon, Sun } from "lucide-react";
import clsx from "clsx";
import {
  AVAILABLE_PALETTES,
  APP_ENV,
  APP_NAME,
  APP_VERSION,
  DATA_MODE,
  MOCK_LATENCY_MS,
} from "../config/app";
import { FEATURES } from "../config/features";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTheme, type Palette, type Theme } from "@/contexts/ThemeContext";
import { useAuth } from "../hooks/useAuth";
import { hasPermission } from "../lib/auth/permissions";
import { resetTestData, type ResetTestDataResult } from "../lib/api/dev.api";
import {
  listDocumentTemplates,
  uploadDocumentTemplate,
  type DocumentTemplate,
} from "../lib/api/document-templates.api";
import { cn } from "@/lib/utils";

type EnvBadgeVariant = "default" | "secondary" | "outline" | "destructive";

const themeOptions: { value: Theme; label: string; icon: React.ReactNode }[] = [
  {
    value: "system",
    label: "Système",
    icon: <Monitor className="h-4 w-4" aria-hidden="true" />,
  },
  {
    value: "light",
    label: "Clair",
    icon: <Sun className="h-4 w-4" aria-hidden="true" />,
  },
  {
    value: "dark",
    label: "Sombre",
    icon: <Moon className="h-4 w-4" aria-hidden="true" />,
  },
];

const themeLabels: Record<Theme | "light" | "dark", string> = {
  system: "Système",
  light: "Clair",
  dark: "Sombre",
};

const paletteColors: Record<Palette, string> = {
  aidn: "bg-[linear-gradient(135deg,#40387f_0_45%,#009b4a_45%_62%,#f4e83a_62%_78%,#4d61a8_78%)]",
  aviation: "bg-[#4d61a8]",
  gabon:
    "bg-[linear-gradient(180deg,#009b4a_0_33%,#f4e83a_33%_66%,#4d61a8_66%)]",
  neutral: "bg-[#514d68]",
};

const paletteLabels: Record<Palette, string> = {
  aidn: "AIDN",
  aviation: "Aviation",
  gabon: "Gabon",
  neutral: "Neutre",
};

export function AppearanceSection(): React.JSX.Element {
  const { theme, setTheme, palette, setPalette, resolvedTheme } = useTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Apparence</CardTitle>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Choisir l’affichage de AIDN sur ce poste.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">Thème</p>
            <Badge variant="outline">
              Résolu : {themeLabels[resolvedTheme]}
            </Badge>
          </div>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Mode de thème"
          >
            {themeOptions.map((option) => (
              <Button
                key={option.value}
                type="button"
                size="sm"
                variant={theme === option.value ? "default" : "outline"}
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
                  "h-8 w-8 rounded-full border-2 transition-transform",
                  paletteColors[availablePalette],
                  palette === availablePalette
                    ? "scale-110 border-foreground ring-2 ring-ring ring-offset-2 ring-offset-background"
                    : "border-transparent hover:scale-105",
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
    case "production":
      return "default";
    case "staging":
      return "secondary";
    case "development":
    case "local":
    default:
      return "outline";
  }
}

function CopyVersionButton({
  version,
}: {
  version: string;
}): React.JSX.Element {
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
      title={copied ? "Copied" : "Copy version"}
      className="h-6 w-6"
    >
      <span className="text-xs">{copied ? "OK" : "CP"}</span>
    </Button>
  );
}

export function SystemSection(): React.JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Système</CardTitle>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Informations techniques en lecture seule.
        </p>
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
          <p className="page-subtitle">
            Configurer les préférences du prototype AIDN.
          </p>
        </div>
      </div>
      <AppearanceSection />
      <DataModeSection />
      <FeatureFlagsSection />
      <SystemSection />
      <DocumentTemplatesSection />
      <DevResetSection />
    </div>
  );
}

function DataModeSection(): React.JSX.Element {
  return (
    <section className="surface rounded-lg p-4">
      <div className="mb-4">
        <h2 className="text-base font-bold text-slate-950 dark:text-white">
          Mode de données
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Comportement actuel de la source de données frontend.
        </p>
      </div>
      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-600 dark:text-slate-300">
            Mode actuel
          </span>
          <span
            className={clsx(
              "rounded px-2 py-0.5 text-xs font-bold",
              DATA_MODE === "mock"
                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200"
                : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
            )}
          >
            {DATA_MODE}
          </span>
        </div>
        {DATA_MODE === "mock" ? (
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-600 dark:text-slate-300">
              Latence mock
            </span>
            <span className="font-semibold">{MOCK_LATENCY_MS}ms</span>
          </div>
        ) : null}
        <p className="text-xs text-slate-400">
          Changer de mode avec VITE_DATA_MODE dans le fichier d’environnement
          local.
        </p>
      </div>
    </section>
  );
}

function DocumentTemplatesSection(): React.JSX.Element {
  const fileRef = useRef<HTMLInputElement>(null);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");

  const load = async () => {
    setIsLoading(true);
    try {
      const result = await listDocumentTemplates({
        documentType: "pre_evaluation_blank_form",
      });
      setTemplates(result.items);
    } catch {
      // non-fatal
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadError("");
    setUploadSuccess("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("code", "PRE_EVAL_FORM");
      fd.append("title", "Formulaire de pré-évaluation");
      fd.append("documentType", "pre_evaluation_blank_form");
      fd.append("phaseKey", "preliminary");
      await uploadDocumentTemplate(fd);
      setUploadSuccess("Modèle mis à jour.");
      if (fileRef.current) fileRef.current.value = "";
      void load();
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Une erreur est survenue.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const active = templates.find((t) => t.isActive);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Modèles de documents</CardTitle>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Configurer le formulaire de pré-évaluation réutilisable pour les
          dossiers DN.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">
            Formulaire de pré-évaluation actif
          </p>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : active ? (
            <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm dark:border-emerald-900 dark:bg-emerald-950">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="font-medium text-emerald-800 dark:text-emerald-200">
                {active.title}
              </span>
              <span className="text-emerald-600 dark:text-emerald-400">
                - configuré
              </span>
            </div>
          ) : (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
              Aucun modèle configuré. Les dossiers DN ne pourront pas rendre le
              formulaire disponible aux postulants.
            </div>
          )}
        </div>

        <form onSubmit={(e) => void handleUpload(e)} className="space-y-3">
          <p className="text-sm font-medium">
            {active ? "Remplacer le modèle actif" : "Téléverser le modèle"}
          </p>
          <div className="space-y-1">
            <Label htmlFor="template-file" className="text-sm">
              Fichier <span className="text-red-500">*</span>
            </Label>
            <Input
              id="template-file"
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx"
              required
              className="h-8 text-sm"
              disabled={isUploading}
            />
            <p className="text-xs text-muted-foreground">PDF, DOC ou DOCX</p>
          </div>
          {uploadError ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              {uploadError}
            </div>
          ) : null}
          {uploadSuccess ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
              {uploadSuccess}
            </div>
          ) : null}
          <Button type="submit" size="sm" disabled={isUploading}>
            {isUploading
              ? "Téléversement…"
              : active
                ? "Remplacer le modèle"
                : "Téléverser le modèle"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

const CONFIRMATION_PHRASE = "RESET AIDN TEST DATA";

const DELETED_LABELS: Record<string, string> = {
  requests: "Demandes",
  courriers: "Courriers",
  dossiers: "Dossiers",
  omaphases: "Phases OMA",
  documents: "Documents",
  meetings: "Réunions",
  dgreviews: "Avis DG",
  notifications: "Notifications",
  auditlogs: "Journal d'audit",
};

function DevResetSection(): React.JSX.Element | null {
  const { user } = useAuth();
  const [confirmation, setConfirmation] = useState("");
  const [includeAuditLogs, setIncludeAuditLogs] = useState(true);
  const [includeNotifications, setIncludeNotifications] = useState(true);
  const [deleteUploadedFiles, setDeleteUploadedFiles] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [result, setResult] = useState<ResetTestDataResult | null>(null);
  const [error, setError] = useState("");

  if (!hasPermission(user, "DEV_DATA_RESET")) {
    return null;
  }

  const isConfirmed = confirmation === CONFIRMATION_PHRASE;

  const handleReset = async () => {
    setDialogOpen(false);
    setIsResetting(true);
    setResult(null);
    setError("");
    try {
      const res = await resetTestData({
        confirmation,
        includeAuditLogs,
        includeNotifications,
        deleteUploadedFiles,
      });
      setResult(res);
      setConfirmation("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Card className="border-red-200 dark:border-red-900">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle
            className="h-5 w-5 text-red-600 dark:text-red-400"
            aria-hidden="true"
          />
          <CardTitle className="text-red-700 dark:text-red-400">
            Zone développeur - Réinitialisation des données de test
          </CardTitle>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Réservé aux phases de test bêta. Supprime toutes les données métier
          sans toucher aux comptes et aux organismes.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm dark:border-amber-900 dark:bg-amber-950">
          <p className="font-semibold text-amber-800 dark:text-amber-300">
            Éléments supprimés
          </p>
          <p className="mt-1 text-amber-700 dark:text-amber-400">
            Demandes, courriers, dossiers, phases OMA, documents, réunions, avis
            DG, notifications (optionnel), journal d'audit (optionnel).
          </p>
          <p className="mt-2 font-semibold text-amber-800 dark:text-amber-300">
            Éléments préservés
          </p>
          <p className="mt-1 text-amber-700 dark:text-amber-400">
            Utilisateurs, comptes internes, organismes postulants, membres,
            modèles de documents.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Options</p>
          <div className="space-y-2">
            {[
              {
                id: "opt-audit",
                checked: includeAuditLogs,
                onChange: setIncludeAuditLogs,
                label: "Supprimer le journal d'audit",
              },
              {
                id: "opt-notif",
                checked: includeNotifications,
                onChange: setIncludeNotifications,
                label: "Supprimer les notifications",
              },
              {
                id: "opt-files",
                checked: deleteUploadedFiles,
                onChange: setDeleteUploadedFiles,
                label: "Supprimer les fichiers téléversés (storage)",
              },
            ].map(({ id, checked, onChange, label }) => (
              <div key={id} className="flex items-center gap-2">
                <input
                  id={id}
                  type="checkbox"
                  className="h-4 w-4"
                  checked={checked}
                  onChange={(e) => onChange(e.target.checked)}
                />
                <Label htmlFor={id} className="text-sm font-normal">
                  {label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="reset-confirm" className="text-sm font-medium">
            Saisir le texte de confirmation{" "}
            <span className="font-mono text-red-600">
              {CONFIRMATION_PHRASE}
            </span>
          </Label>
          <Input
            id="reset-confirm"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder={CONFIRMATION_PHRASE}
            className="font-mono text-sm"
            autoComplete="off"
          />
        </div>

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        ) : null}

        {result ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm dark:border-emerald-900 dark:bg-emerald-950">
            <p className="font-semibold text-emerald-700 dark:text-emerald-300">
              Réinitialisation effectuée.
            </p>
            <dl className="mt-2 grid gap-1 sm:grid-cols-2">
              {Object.entries(result.counts).map(([key, count]) => (
                <div key={key} className="flex justify-between gap-3">
                  <dt className="text-slate-500">
                    {DELETED_LABELS[key] ?? key}
                  </dt>
                  <dd className="font-semibold text-slate-800 dark:text-slate-200">
                    {count} supprimé(s)
                  </dd>
                </div>
              ))}
              {result.deletedFiles > 0 ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Fichiers storage</dt>
                  <dd className="font-semibold text-slate-800 dark:text-slate-200">
                    {result.deletedFiles} supprimé(s)
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>
        ) : null}

        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={!isConfirmed || isResetting}
          onClick={() => setDialogOpen(true)}
        >
          <AlertTriangle className="mr-2 h-4 w-4" aria-hidden="true" />
          {isResetting
            ? "Réinitialisation en cours…"
            : "Réinitialiser les données de test"}
        </Button>
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la réinitialisation</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Toutes les données de test
              sélectionnées seront supprimées définitivement. Les comptes et
              organismes sont préservés.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isResetting}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isResetting}
              onClick={() => void handleReset()}
            >
              Confirmer la réinitialisation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function FeatureFlagsSection(): React.JSX.Element {
  return (
    <section className="surface rounded-lg p-4">
      <div className="mb-4">
        <h2 className="text-base font-bold text-slate-950 dark:text-white">
          Fonctionnalités
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Registre frontend statique des sections du prototype.
        </p>
      </div>
      <div className="space-y-2">
        {Object.entries(FEATURES).map(([key, feature]) => (
          <div
            key={key}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="text-slate-700 dark:text-slate-200">
              {feature.label}
            </span>
            <span
              className={clsx(
                "rounded px-2 py-0.5 text-xs font-bold",
                feature.enabled
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200"
                  : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300",
              )}
            >
              {feature.enabled ? "Activée" : "Désactivée"}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
