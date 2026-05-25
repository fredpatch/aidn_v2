import { Card, CardContent } from "@/components/ui/card";

export function DossierHistoriqueTab(): React.JSX.Element {
  return (
    <Card>
      <CardContent className="p-6 text-sm text-muted-foreground">
        L'historique des actions et événements du dossier sera affiché ici.
      </CardContent>
    </Card>
  );
}
