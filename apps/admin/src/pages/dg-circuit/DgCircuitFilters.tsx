import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { DgCircuitBucket, DgCircuitSource } from "@/lib/api/dg-circuit";

import { bucketStyle, bucketTabs, sourceOptions } from "./constants";
import type { DgCircuitTaskCounts } from "./types";

export function DgCircuitFilters({
  bucket,
  counts,
  search,
  source,
  onBucketChange,
  onSearchChange,
  onSourceChange,
}: {
  bucket: DgCircuitBucket | "all";
  counts?: DgCircuitTaskCounts;
  search: string;
  source: DgCircuitSource | "all";
  onBucketChange: (bucket: DgCircuitBucket | "all") => void;
  onSearchChange: (search: string) => void;
  onSourceChange: (source: DgCircuitSource | "all") => void;
}): React.JSX.Element {
  return (
    <>
      <div className="flex flex-wrap gap-2">
        {bucketTabs.map((tab) => {
          const isActive = bucket === tab.key;
          const style = tab.key !== "all" ? bucketStyle[tab.key as DgCircuitBucket] : null;
          return (
            <Button
              key={tab.key}
              type="button"
              variant={isActive && style ? "outline" : isActive ? "default" : "outline"}
              size="sm"
              className={
                isActive && style ? cn("border", style.buttonClass) : undefined
              }
              onClick={() => onBucketChange(tab.key)}
            >
              {tab.label}
              {tab.countKey ? ` (${counts?.[tab.countKey] ?? 0})` : ""}
            </Button>
          );
        })}
      </div>

      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_13rem]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Reference, organisme, postulant..."
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
        <select
          className="control"
          value={source}
          onChange={(event) => onSourceChange(event.target.value as DgCircuitSource | "all")}
        >
          {sourceOptions.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
