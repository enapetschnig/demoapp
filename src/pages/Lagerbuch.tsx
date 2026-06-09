import { useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { fmtDateTime, fmtNumber } from "@/lib/format";
import {
  useStockMovements, useStockItems, type StockMovement,
} from "@/hooks/queries/useStock";

const TYPE_LABEL: Record<string, string> = {
  einbuchung: "Einbuchung",
  ausbuchung: "Ausbuchung",
};

export default function Lagerbuch() {
  const { data: movements = [], isLoading } = useStockMovements();
  const { data: items = [] } = useStockItems();

  const itemName = useMemo(() => {
    const m = new Map<string, string>();
    for (const it of items) m.set(it.id, it.name);
    return m;
  }, [items]);

  const columns: Column<StockMovement>[] = [
    {
      key: "created_at", header: "Datum",
      accessor: (r) => r.created_at,
      render: (r) => fmtDateTime(r.created_at),
    },
    {
      key: "stock_item_id", header: "Lagerartikel", filterable: true,
      accessor: (r) => itemName.get(r.stock_item_id) ?? r.stock_item_id,
      render: (r) => itemName.get(r.stock_item_id) ?? "—",
    },
    {
      key: "old_stock", header: "Altbestand", className: "text-right",
      render: (r) => fmtNumber(Number(r.old_stock ?? 0)),
    },
    {
      key: "quantity", header: "Menge", className: "text-right",
      render: (r) => fmtNumber(Number(r.quantity ?? 0)),
    },
    {
      key: "new_stock", header: "Neubestand", className: "text-right",
      render: (r) => fmtNumber(Number(r.new_stock ?? 0)),
    },
    {
      key: "type", header: "Buchung",
      render: (r) => <Badge variant="secondary">{TYPE_LABEL[r.type] ?? r.type}</Badge>,
    },
    { key: "note", header: "Notiz", sortable: false, render: (r) => r.note ?? "—" },
  ];

  return (
    <div>
      <PageHeader title="Lagerbuch" subtitle="Alle Lagerbewegungen" />
      <DataTable
        data={movements}
        columns={columns}
        loading={isLoading}
        getRowId={(r) => r.id}
      />
    </div>
  );
}
