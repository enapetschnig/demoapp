import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { fmtEUR, fmtDate } from "@/lib/format";
import {
  useOverdueInvoices,
  useCreateDunning,
  type OverdueInvoice,
} from "@/hooks/queries/useDunning";
import { Bell } from "lucide-react";

function customerName(doc: OverdueInvoice): string {
  const c = doc.customer;
  if (!c) return "—";
  if (c.company_name) return c.company_name;
  const name = [c.first_name, c.last_name].filter(Boolean).join(" ");
  return name || c.customer_number || "—";
}

function levelLabel(level: number): string {
  if (level <= 0) return "Keine";
  if (level === 1) return "Zahlungserinnerung";
  return `${level - 1}. Mahnung`;
}

export default function Mahnungen() {
  const { data = [], isLoading } = useOverdueInvoices();
  const createDunning = useCreateDunning();

  const raise = async (r: OverdueInvoice) => {
    try {
      await createDunning.mutateAsync({
        document_id: r.id,
        current_level: r.max_dunning_level,
      });
      toast.success(`Mahnstufe erhöht (${levelLabel(r.max_dunning_level + 1)})`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const columns: Column<OverdueInvoice>[] = [
    {
      key: "number", header: "Dokument", filterable: true,
      render: (r) => <span className="text-link">{r.number ?? "—"}</span>,
    },
    {
      key: "due_date", header: "Fällig seit",
      accessor: (r) => r.due_date,
      render: (r) => (r.due_date ? fmtDate(r.due_date) : "—"),
    },
    {
      key: "customer", header: "Kunde", filterable: true,
      accessor: (r) => customerName(r),
      render: (r) => customerName(r),
    },
    {
      key: "gross_amount", header: "Bruttobetrag", className: "text-right",
      accessor: (r) => Number(r.gross_amount),
      render: (r) => fmtEUR(Number(r.gross_amount)),
    },
    {
      key: "open_amount", header: "Offen", className: "text-right",
      accessor: (r) => Number(r.open_amount),
      render: (r) => fmtEUR(Number(r.open_amount)),
    },
    {
      key: "current_level", header: "Mahnstufe",
      accessor: (r) => r.max_dunning_level,
      render: (r) => (
        <Badge variant={r.max_dunning_level > 0 ? "destructive" : "secondary"}>
          {levelLabel(r.max_dunning_level)}
        </Badge>
      ),
    },
    {
      key: "actions", header: "", sortable: false, className: "text-right",
      render: (r) => (
        <Button
          size="sm"
          variant="secondary"
          className="gap-1.5"
          disabled={createDunning.isPending}
          onClick={(e) => { e.stopPropagation(); raise(r); }}
        >
          <Bell className="h-4 w-4" /> Mahnstufe erhöhen
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Buchhaltung — Mahnungen"
        subtitle="Überfällige Rechnungen & Mahnwesen"
      />
      <DataTable
        data={data}
        columns={columns}
        loading={isLoading}
        getRowId={(r) => r.id}
        emptyText="Keine überfälligen Rechnungen gefunden"
      />
    </div>
  );
}
