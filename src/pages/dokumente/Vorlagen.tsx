import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { docLabel } from "@/lib/documentTypes";
import { useDocTemplates, useDeleteDocTemplate, type DocTemplate } from "@/hooks/queries/useDocTemplates";
import { toast } from "sonner";
import { FilePlus2, Trash2 } from "lucide-react";

export default function Vorlagen() {
  const navigate = useNavigate();
  const { data = [], isLoading } = useDocTemplates();
  const del = useDeleteDocTemplate();

  const columns: Column<DocTemplate>[] = [
    { key: "name", header: "Name", filterable: true, render: (t) => <span className="font-medium">{t.name}</span> },
    { key: "base_type", header: "Typ", render: (t) => docLabel(t.base_type) },
    { key: "items", header: "Positionen", sortable: false, render: (t) => Array.isArray(t.items) ? `${(t.items as unknown[]).length}` : "0" },
    { key: "last_used_at", header: "Zuletzt verwendet", render: (t) => (t.last_used_at ? fmtDateTime(t.last_used_at) : "—") },
    { key: "created_at", header: "Erstellt", render: (t) => fmtDate(t.created_at) },
    {
      key: "actions", header: "", sortable: false, className: "text-right",
      render: (t) => (
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="secondary" className="gap-1.5" onClick={(e) => { e.stopPropagation(); navigate(`/dokumente/neu?template=${t.id}`); }}>
            <FilePlus2 className="h-4 w-4" /> Verwenden
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={async (e) => { e.stopPropagation(); await del.mutateAsync(t.id); toast.success("Vorlage gelöscht"); }}>
            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Vorlagen" subtitle="Verwaltung für Dokumente"
        actions={<Button variant="secondary" onClick={() => navigate("/dokumente/neu")} className="gap-1.5"><FilePlus2 className="h-4 w-4" /> Neues Dokument</Button>} />
      <DataTable data={data} columns={columns} loading={isLoading} getRowId={(t) => t.id}
        emptyText="Noch keine Vorlagen — im Dokumenteneditor über Als Vorlage speichern anlegen." />
    </div>
  );
}
