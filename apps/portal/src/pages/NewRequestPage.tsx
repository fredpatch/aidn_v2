import { ArrowLeft, Save } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  createRequest,
  type PortalRequestType,
} from "../lib/api/portal.api";
import { PortalApiError } from "../lib/api/http";
import { portalRoutes } from "../lib/routes";

const requestTypeOptions: Array<{ value: PortalRequestType; label: string }> = [
  { value: "oma_approval", label: "Agrement OMA" },
  { value: "oma_recognition", label: "Reconnaissance OMA" },
  { value: "oma_renewal", label: "Renouvellement OMA" },
  { value: "oma_modification", label: "Modification OMA" },
];

export function NewRequestPage(): React.JSX.Element {
  const navigate = useNavigate();
  const [requestType, setRequestType] = useState<PortalRequestType | "">("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!requestType) {
      setError("Type de demande requis.");
      return;
    }

    if (subject.trim().length < 3) {
      setError("Objet de la demande requis, minimum 3 caracteres.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { request } = await createRequest({
        requestType,
        subject: subject.trim(),
        message: message.trim() || undefined,
      });
      navigate(portalRoutes.requestDetail(request.id));
    } catch (caught) {
      setError(
        caught instanceof PortalApiError
          ? caught.message
          : "Une erreur est survenue. Veuillez reessayer.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="flex flex-col gap-6">
      <div>
        <Link className="btn btn-secondary mb-4 w-fit" to={portalRoutes.requests}>
          <ArrowLeft size={16} aria-hidden="true" />
          Mes demandes
        </Link>
        <h1 className="page-title">Nouvelle demande</h1>
        <p className="page-subtitle">
          Creez un brouillon de demande avant d'ajouter le courrier initial.
        </p>
      </div>

      <form className="surface grid gap-4 rounded-lg p-5" onSubmit={handleSubmit}>
        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        <div className="field">
          <label htmlFor="requestType">Type de demande</label>
          <select
            id="requestType"
            className="control"
            value={requestType}
            onChange={(event) =>
              setRequestType(event.target.value as PortalRequestType | "")
            }
            required
          >
            <option value="">Selectionner un type</option>
            {requestTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="subject">Objet de la demande</label>
          <input
            id="subject"
            className="control"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            minLength={3}
            maxLength={200}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="message">Message complementaire</label>
          <textarea
            id="message"
            className="control min-h-32"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={3000}
          />
        </div>

        <div>
          <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
            <Save size={16} aria-hidden="true" />
            {isSubmitting ? "Creation..." : "Creer le brouillon"}
          </button>
        </div>
      </form>
    </section>
  );
}
