import { TABS } from "./constants";
import type { RequestDetailTab } from "./types";

type RequestWorkflowTabsProps = {
  activeTab: RequestDetailTab;
  hasActionRequired: boolean;
  hasDossier: boolean;
  onTabChange: (tab: RequestDetailTab) => void;
};

export function RequestWorkflowTabs({
  activeTab,
  hasActionRequired,
  hasDossier,
  onTabChange,
}: RequestWorkflowTabsProps): React.JSX.Element {
  return (
    <div className="portal-tab-bar">
      {TABS.map(({ key, label }) => {
        const isActive = activeTab === key;
        const needsBadge = key === "actions" && hasActionRequired;
        const isDossierDisabled = key === "dossier" && !hasDossier;

        return (
          <button
            key={key}
            type="button"
            disabled={isDossierDisabled}
            onClick={() => onTabChange(key)}
            className={[
              "portal-tab",
              isActive ? "portal-tab-active" : "",
            ].join(" ")}
          >
            {label}
            {needsBadge ? (
              <span
                className="h-2 w-2 rounded-full bg-amber-400"
                aria-label="action requise"
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
