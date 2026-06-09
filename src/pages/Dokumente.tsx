import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fmtEUR, fmtDate } from "@/lib/format";
import { docLabel, DOC_STATUS_LABELS } from "@/lib/documentTypes";
import { useDocuments, type DocumentRow } from "@/hooks/queries/useDocuments";
import { Plus } from "lucide-react";

const custName = (d: DocumentRow) =>
  [d.customer?.first_name, d.customer?.last_name].filter(Boolean).join(" ") || d.customer?.company_name || "—";

const statusVariant = (s: string): "default" | "secondary" | "destructive" => {
  if (["erstellt", "versendet", "angenommen", "erneut_versendet"].includes(s)) return "default";
  if (["abgelehnt", "storniert", "geloescht"].includes(s)) return "destructive";
  return "secondary";
};

export default function Dokumente() {
  const navigate = useNavigate();
  const { data = [], isLoading } = useDocuments();

  const columns: Column<DocumentRow>[] = [
    { key: "number", header: "#", filterable: true, render: (d) => <span className="text-link">{d.number ?? "Entwurf"}</span> },
    { key: "name", header: "Name", filterable: true, render: (d) => d.name || d.subject || "—" },
    { key: "base_type", header: "Typ", filterable: true, render: (d) => docLabel(d.base_type) },
    { key: "kunde", header: "Kunde", accessor: custName, filterable: true, render: custName },
    { key: "net_amount", header: "Nettobetrag", className: "text-right", render: (d) => fmtEUR(Number(d.net_amount)) },
    { key: "gross_amount", header: "Bruttobetrag", className: "text-right", render: (d) => fmtEUR(Number(d.gross_amount)) },
    { key: "doc_date", header: "Datum", render: (d) => fmtDate(d.doc_date) },
    { key: "status", header: "Status", render: (d) => <Badge variant={statusVariant(d.status)}>{DOC_STATUS_LABELS[d.status] ?? d.status}</Badge> },
  ];

  return (
    <div>
      <PageHeader
        title="Dokumente"
        subtitle="Übersicht über erstellte Dokumente"
        actions={<Button onClick={() => navigate("/dokumente/neu")} className="gap-1.5"><Plus className="h-4 w-4" /> Dokument</Button>}
      />
      <DataTable data={data} columns={columns} loading={isLoading} getRowId={(d) => d.id} onRowClick={(d) => navigate(`/dokumente/${d.id}`)} />
    </div>
  );
}
