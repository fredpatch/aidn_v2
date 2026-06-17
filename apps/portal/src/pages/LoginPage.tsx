import { Loader2, LockKeyhole, LogIn, Mail, ShieldCheck } from "lucide-react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Field, FieldError, FieldLabel } from "../components/ui/field";
import { Input } from "../components/ui/input";
import { usePortalAuth } from "../lib/auth/PortalAuthContext";
import { portalRoutes } from "../lib/routes";
import {
  getLoginErrorMessage,
  loginDefaultValues,
  loginValidationRules,
  normalizeLoginValues,
  type LoginFormValues,
} from "./login/login-form.helpers";

export function LoginPage(): React.JSX.Element {
  const { isAuthenticated, isLoading, login } = usePortalAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: loginDefaultValues,
    mode: "onBlur",
  });

  if (!isLoading && isAuthenticated) {
    return <Navigate to={portalRoutes.dashboard} replace />;
  }

  const onSubmit: SubmitHandler<LoginFormValues> = async (values) => {
    try {
      const credentials = normalizeLoginValues(values);
      await login(credentials.email, credentials.password);
      toast.success("Connexion réussie", {
        description: "Votre session postulant est ouverte.",
      });
      navigate(portalRoutes.dashboard, { replace: true });
    } catch (error) {
      const message = getLoginErrorMessage(error);
      setError("root.server", { message });
      toast.error("Connexion impossible", {
        description: message,
      });
    }
  };

  return (
    <section className="mx-auto grid w-full max-w-5xl gap-6 py-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
      <div className="space-y-5">
        <Badge variant="outline" className="gap-1.5">
          <ShieldCheck size={13} aria-hidden="true" />
          Espace postulant
        </Badge>
        <h1 className="page-title">Connexion postulant</h1>
        <p className="page-subtitle">
          Connectez-vous avec l'adresse e-mail et le mot de passe utilisés lors
          de votre demande de compte approuvée.
        </p>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="border-b">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-md bg-slate-100 text-slate-700">
              <LogIn size={20} aria-hidden="true" />
            </span>
            <div>
              <CardTitle>Accès portail</CardTitle>
              <CardDescription>Session postulant sécurisée</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4"
            onSubmit={(event) => void handleSubmit(onSubmit)(event)}
            noValidate
          >
            <Field>
              <FieldLabel htmlFor="email">Adresse e-mail</FieldLabel>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="contact@organisme.ga"
                invalid={Boolean(errors.email)}
                disabled={isSubmitting}
                badge={<Badge variant="destructive">Requis</Badge>}
                aria-invalid={errors.email ? "true" : "false"}
                aria-describedby={errors.email ? "email-error" : undefined}
                {...register("email", loginValidationRules.email)}
              />
              <FieldError id="email-error">{errors.email?.message}</FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="Votre mot de passe"
                invalid={Boolean(errors.password)}
                disabled={isSubmitting}
                badge={<Badge variant="destructive">Requis</Badge>}
                aria-invalid={errors.password ? "true" : "false"}
                aria-describedby={
                  errors.password ? "password-error" : undefined
                }
                {...register("password", loginValidationRules.password)}
              />
              <FieldError id="password-error">
                {errors.password?.message}
              </FieldError>
              <FieldError className="text-xs text-red-600">
                {errors.root?.server?.message}
              </FieldError>
            </Field>

            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden="true" />
                  Connexion en cours...
                </>
              ) : (
                <>
                  <LockKeyhole aria-hidden="true" />
                  Se connecter
                </>
              )}
            </Button>

            <Button asChild variant="link" className="h-auto justify-start px-0">
              <Link to={portalRoutes.accountRequest}>
                <Mail aria-hidden="true" />
                Pas encore de compte ? Demander un compte
              </Link>
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
