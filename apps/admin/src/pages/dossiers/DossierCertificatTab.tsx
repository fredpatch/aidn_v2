import { Card, CardContent } from "@/components/ui/card";

export function DossierCertificatTab(): React.JSX.Element {
  return (
    <Card>
      <CardContent className="p-6 text-sm text-muted-foreground">
        Le suivi du certificat sera disponible ici lors de la phase de
        délivrance.
      </CardContent>
    </Card>
  );
}
