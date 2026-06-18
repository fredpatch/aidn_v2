import { Badge } from "@/components/ui/badge";
import type { DgCircuitBucket } from "@/lib/api/dg-circuit.api";

export function StatusBadge({
  bucket,
}: {
  bucket: DgCircuitBucket;
}): React.JSX.Element {
  if (
    bucket === "returned_scanned" ||
    bucket === "decision_recorded" ||
    bucket === "processed"
  ) {
    return (
      <Badge
        variant="outline"
        className="border-emerald-200 bg-emerald-50 text-emerald-700"
      >
        Signe DG
      </Badge>
    );
  }
  if (bucket === "awaiting_return") {
    return <Badge variant="secondary">En circuit DG</Badge>;
  }
  return <Badge variant="outline">A imprimer</Badge>;
}
