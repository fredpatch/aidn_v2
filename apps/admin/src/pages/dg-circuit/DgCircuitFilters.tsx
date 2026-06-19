import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DgCircuitBucket } from "@/lib/api/dg-circuit";

import { bucketTabs } from "./constants";
import type { DgCircuitTaskCounts } from "./types";

export function DgCircuitFilters({
  bucket,
  counts,
  search,
  onBucketChange,
  onSearchChange,
}: {
  bucket: DgCircuitBucket | "all";
  counts?: DgCircuitTaskCounts;
  search: string;
  onBucketChange: (bucket: DgCircuitBucket | "all") => void;
  onSearchChange: (search: string) => void;
}): React.JSX.Element {
  return (
    <>
      <div className="flex flex-wrap gap-2">
        {bucketTabs.map((tab) => (
          <Button
            key={tab.key}
            type="button"
            variant={bucket === tab.key ? "default" : "outline"}
            size="sm"
            onClick={() => onBucketChange(tab.key)}
          >
            {tab.label}
            {tab.countKey ? ` (${counts?.[tab.countKey] ?? 0})` : ""}
          </Button>
        ))}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Reference, organisme, postulant..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>
    </>
  );
}
