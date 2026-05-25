import { Card, CardContent } from "@/components/ui/card";

export function DossierMeetingsTab(): React.JSX.Element {
  return (
    <Card>
      <CardContent className="p-6 text-sm text-muted-foreground">
        Les réunions et convocations du dossier seront affichées ici
        chronologiquement.
      </CardContent>
    </Card>
  );
}
