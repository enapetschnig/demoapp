import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { fmtDate } from "@/lib/format";
import { Plus } from "lucide-react";

// Platzhalter-Datensatz bis Vorlagen-Backend angebunden wird.
interface Template extends Record<string, unknown> {
  id: string;
  name: string;
  last_used_by: string | null;
  last_used_at: string | null;
}

const PLACEHOLDER: Template[] = [
  { id: "1", name: "Standard-Angebot", last_used_by: "—", last_used_at: null },
  { id: "2", name: "Standard-Rechnung", last_used_by: "—", last_used_at: null },
];

export default function Vorlagen() {
  const columns: Column<Template>[] = [
    { key: "name", header: "Name", filterable: true, render: (r) => <span className="text-link">{r.name}</span> },
    { key: "last_used_by", header: "Zuletzt verwendet", render: (r) => r.last_used_by ?? "—" },
    { key: "last_used_at", header: "Datum", width: "140px", render: (r) => fmtDate(r.last_used_at) || "—" },
  ];

  return (
    <div>
      <PageHeader
        title="Vorlagen"
        subtitle="Verwaltung für Dokumente"
        actions={
          <Button className="gap-1.5">
            <Plus className="h-4 w-4" /> Vorlage
          </Button>
        }
      />
      <DataTable
        data={PLACEHOLDER}
        columns={columns}
        getRowId={(r) => r.id}
        emptyText="Noch keine Vorlagen vorhanden"
      />
    </div>
  );
}
