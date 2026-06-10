import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { ErrorBoundary } from "./ErrorBoundary";
import { GlobalSearch } from "./GlobalSearch";
import { CreateDocumentDialog } from "./CreateDocumentDialog";

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [docDialogOpen, setDocDialogOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handler = () => setDocDialogOpen(true);
    window.addEventListener("open-create-document", handler);
    return () => window.removeEventListener("open-create-document", handler);
  }, []);
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} onOpenSearch={() => setSearchOpen(true)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <ErrorBoundary key={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
      <CreateDocumentDialog open={docDialogOpen} onOpenChange={setDocDialogOpen} />
    </div>
  );
}
