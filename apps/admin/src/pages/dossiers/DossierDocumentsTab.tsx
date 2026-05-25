import { Card, CardContent } from "@/components/ui/card";

export function DossierDocumentsTab(): React.JSX.Element {
  return (
    <Card>
      <CardContent className="p-6 text-sm text-muted-foreground">
        Les documents du dossier seront regroupés ici par phase, type et statut.
      </CardContent>
    </Card>
  );
}
