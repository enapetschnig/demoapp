import { useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { fmtDateTime, fmtNumber } from "@/lib/format";
import { useStockMovements, useStockItems, type StockMovement } from "@/hooks/queries/useStock";

export default function LagerBewegungen({ type }: { type: "einbuchung" | "ausbuchung" }) {
  const { data: movements = [], isLoading } = useStockMovements();
  const { data: items = [] } = useStockItems();
  const itemName = useMemo(() => Object.fromEntries(items.map((i) => [i.id, i.name])), [items]);

  const rows = movements.filter((m) => m.type === type);
  const title = type === "einbuchung" ? "Einbuchungen" : "Ausbuchungen";

  const columns: Column<StockMovement>[] = [
    { key: "created_at", header: "Datum", render: (m) => fmtDateTime(m.created_at) },
    { key: "stock_item_id", header: "Lagerartikel", filterable: true, accessor: (m) => itemName[m.stock_item_id] ?? "", render: (m) => itemName[m.stock_item_id] ?? "—" },
    { key: "booking_number", header: "Buchungsnr." },
    { key: "quantity", header: "Menge", className: "text-right", render: (m) => fmtNumber(Number(m.quantity), 2) },
    { key: "new_stock", header: "Neubestand", className: "text-right", render: (m) => fmtNumber(Number(m.new_stock), 2) },
    { key: "note", header: "Notiz" },
  ];

  return (
    <div>
      <PageHeader title={title} subtitle="Lagerbewegungen" />
      <DataTable data={rows} columns={columns} loading={isLoading} getRowId={(m) => m.id}
        emptyText={`Keine ${title} vorhanden`} />
    </div>
  );
}
