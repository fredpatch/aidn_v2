import { Card, CardContent } from "@/components/ui/card";
import type { DgCircuitTaskCounts } from "./types";

export function DgCircuitKpis({
  total,
  counts,
}: {
  total: number;
  counts: DgCircuitTaskCounts;
}): React.JSX.Element {
  const kpis = [
    { label: "Total", value: total },
    { label: "A imprimer", value: counts.toTransmit },
    { label: "En circuit", value: counts.awaitingReturn },
    { label: "Signe DG", value: counts.processed },
  ];

  return (
    <div className="flex flex-wrap gap-3">
      {kpis.map((kpi) => (
        <Card key={kpi.label} className="min-w-[80px] flex-shrink-0">
          <CardContent className="p-3 text-center">
            <p className="text-xl font-semibold tabular-nums">{kpi.value}</p>
            <p className="text-xs text-muted-foreground">{kpi.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
