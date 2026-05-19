import { Outlet } from "react-router-dom";

import { PortalHeader } from "../components/PortalHeader";
import { PortalSidebar } from "../components/PortalSidebar";

export function PortalLayout(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <PortalHeader />
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[240px_1fr] lg:px-8">
        <PortalSidebar />
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
