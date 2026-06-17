import { Outlet } from "react-router-dom";
import { Toaster } from "sonner";

import { PortalHeader } from "../components/PortalHeader";

export function PublicLayout(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <PortalHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      <Toaster position="bottom-right" richColors />
    </div>
  );
}
