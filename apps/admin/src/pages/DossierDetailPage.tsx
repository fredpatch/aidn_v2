import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, SkeletonCard } from "@/components/states";
import { getDossier, type AdminDossierDetail } from "@/lib/api/dossiers";
import {
  dossierStatusLabels,
  dossierTypeLabels,
  formatDate,
} from "./dossiers/dossier-detail.labels";
import { DossierCertificatTab } from "./dossiers/DossierCertificatTab";
import { DossierCourriersTab } from "./dossiers/DossierCourriersTab";
import { DossierDocumentsTab } from "./dossiers/DossierDocumentsTab";
import { DossierHistoriqueTab } from "./dossiers/DossierHistoriqueTab";
import { DossierMeetingsTab } from "./dossiers/DossierMeetingsTab";
import { DossierOverviewTab } from "./dossiers/DossierOverviewTab";
import { DossierPhasesTab } from "./dossiers/DossierPhasesTab";

export function DossierDetailPage(): React.JSX.Element {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<AdminDossierDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const load = async () => {
    if (!id) return;
    setIsLoading(true);
    setError("");
    try {
      setDetail(await getDossier(id));
    } catch {
      setError("Impossible de charger le dossier.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [id]);

  if (isLoading) {
    return (
      <div className="page-container">
        <SkeletonCard lines={4} />
        <SkeletonCard lines={6} />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="page-container">
        <EmptyState
          message={error || "Dossier introuvable."}
          action={
            <Button asChild variant="outline">
              <Link to="/dossiers">Retour aux dossiers DN</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const { dossier } = detail;

  return (
    <div className="page-container">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
            <Link to="/dossiers">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Retour aux dossiers DN
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="page-title">
              {dossier.dossierNumber ?? dossier.id}
            </h1>
            <Badge variant="outline">
              {dossierStatusLabels[dossier.status] ?? dossier.status}
            </Badge>
          </div>
          <p className="page-subtitle">
            {dossier.organization?.canonicalName ?? "Organisme non renseigné"}{" "}
            -{" "}
            {dossier.postulant?.fullName ?? "Postulant non renseigné"}
          </p>
        </div>
        <div className="grid gap-1 text-left text-sm sm:text-right">
          <span className="text-muted-foreground">Type</span>
          <span className="font-semibold">
            {dossierTypeLabels[dossier.dossierType]}
          </span>
          <span className="text-muted-foreground">Ouverture</span>
          <span className="font-semibold">{formatDate(dossier.openedAt)}</span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
        <TabsList className="flex h-auto flex-wrap justify-start gap-0.5">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="phases">Phases OMA</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="meetings">Réunions</TabsTrigger>
          <TabsTrigger value="courriers">Courriers</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
          <TabsTrigger value="certificate">Certificat</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <DossierOverviewTab detail={detail} />
        </TabsContent>
        <TabsContent value="phases" className="mt-4">
          <DossierPhasesTab
            detail={detail}
            dossierId={dossier.id}
            onRefresh={() => void load()}
            onNavigateToTab={setActiveTab}
          />
        </TabsContent>
        <TabsContent value="documents" className="mt-4">
          <DossierDocumentsTab detail={detail} dossierId={dossier.id} />
        </TabsContent>
        <TabsContent value="meetings" className="mt-4">
          <DossierMeetingsTab detail={detail} />
        </TabsContent>
        <TabsContent value="courriers" className="mt-4">
          <DossierCourriersTab detail={detail} />
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <DossierHistoriqueTab detail={detail} />
        </TabsContent>
        <TabsContent value="certificate" className="mt-4">
          <DossierCertificatTab detail={detail} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
