import { EmptyState, SkeletonCard } from "@/components/states";
import type { DgCircuitTask } from "@/lib/api/dg-circuit.api";

import { CourrierTaskRow } from "./CourrierTaskRow";

export function DgCircuitTaskList({
  isLoading,
  tasks,
  selectedTaskId,
  onSelectTask,
}: {
  isLoading: boolean;
  tasks?: DgCircuitTask[];
  selectedTaskId?: string;
  onSelectTask: (task: DgCircuitTask) => void;
}): React.JSX.Element {
  if (isLoading) {
    return (
      <div className="grid gap-2">
        <SkeletonCard lines={3} />
        <SkeletonCard lines={3} />
        <SkeletonCard lines={3} />
      </div>
    );
  }

  if (tasks && tasks.length > 0) {
    return (
      <div className="grid gap-2">
        {tasks.map((task) => (
          <CourrierTaskRow
            key={task.id}
            task={task}
            isSelected={selectedTaskId === task.id}
            onClick={() => onSelectTask(task)}
          />
        ))}
      </div>
    );
  }

  return (
    <EmptyState message="Aucun courrier dans cette vue. Les courriers signes DG restent disponibles via le filtre Signe DG." />
  );
}
