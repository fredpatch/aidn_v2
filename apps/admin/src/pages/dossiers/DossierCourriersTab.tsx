import { Card, CardContent } from "@/components/ui/card";

export function DossierCourriersTab(): React.JSX.Element {
  return (
    <Card>
      <CardContent className="p-6 text-sm text-muted-foreground">
        Les courriers officiels liés au dossier seront centralisés ici.
      </CardContent>
    </Card>
  );
}
