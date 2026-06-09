import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { fmtNumber } from "@/lib/format";
import {
  useStockItems, useUpsertStockItem, useAddMovement, type StockItem,
} from "@/hooks/queries/useStock";
import { Plus, AlertTriangle, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";

function StockItemDialog({
  open, onOpenChange, item,
}: { open: boolean; onOpenChange: (o: boolean) => void; item?: StockItem | null }) {
  const upsert = useUpsertStockItem();
  const [f, setF] = useState<Partial<StockItem>>({});
  useEffect(() => { if (open) setF(item ?? { planned_stock: 0 }); }, [open, item]);
  const set = (k: keyof StockItem, v: unknown) => setF((p) => ({ ...p, [k]: v }));
  const num = (v: string) => (v === "" ? 0 : Number(v.replace(",", ".")));

  const save = async () => {
    if (!f.name) return toast.error("Bitte einen Namen angeben.");
    try {
      await upsert.mutateAsync(f);
      toast.success("Lagerartikel gespeichert");
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{item ? "Lagerartikel bearbeiten" : "Lagerartikel erstellen"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 pt-1">
          <div className="col-span-2 space-y-1.5">
            <Label>Name</Label>
            <Input value={f.name ?? ""} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Lagernummer</Label>
            <Input value={f.stock_number ?? ""} onChange={(e) => set("stock_number", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Kategorie</Label>
            <Input value={f.category ?? ""} onChange={(e) => set("category", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Sollbestand</Label>
            <Input value={String(f.planned_stock ?? 0)} onChange={(e) => set("planned_stock", num(e.target.value))} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Beschreibung</Label>
            <Textarea rows={3} value={f.description ?? ""} onChange={(e) => set("description", e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button onClick={save} disabled={upsert.isPending}>Speichern</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MovementDialog({
  open, onOpenChange, item, type,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  item: StockItem | null;
  type: "einbuchung" | "ausbuchung";
}) {
  const add = useAddMovement();
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  useEffect(() => { if (open) { setQuantity(""); setNote(""); } }, [open]);

  const save = async () => {
    if (!item) return;
    const q = quantity === "" ? 0 : Number(quantity.replace(",", "."));
    if (!(q > 0)) return toast.error("Bitte eine Menge größer 0 angeben.");
    try {
      await add.mutateAsync({ stock_item_id: item.id, type, quantity: q, note: note || null });
      toast.success(type === "einbuchung" ? "Eingebucht" : "Ausgebucht");
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {type === "einbuchung" ? "Einbuchen" : "Ausbuchen"}
            {item ? ` — ${item.name}` : ""}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          <div className="text-sm text-muted-foreground">
            Aktueller Bestand: <span className="font-medium text-foreground">{fmtNumber(Number(item?.stock ?? 0))}</span>
          </div>
          <div className="space-y-1.5">
            <Label>Menge</Label>
            <Input value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" />
          </div>
          <div className="space-y-1.5">
            <Label>Notiz</Label>
            <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button onClick={save} disabled={add.isPending}>Buchen</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Lager() {
  const { data = [], isLoading } = useStockItems();
  const [itemOpen, setItemOpen] = useState(false);
  const [edit, setEdit] = useState<StockItem | null>(null);
  const [moveOpen, setMoveOpen] = useState(false);
  const [moveItem, setMoveItem] = useState<StockItem | null>(null);
  const [moveType, setMoveType] = useState<"einbuchung" | "ausbuchung">("einbuchung");

  const openMove = (item: StockItem, type: "einbuchung" | "ausbuchung") => {
    setMoveItem(item);
    setMoveType(type);
    setMoveOpen(true);
  };

  const columns: Column<StockItem>[] = [
    {
      key: "stock_number", header: "Lagernummer", filterable: true,
      render: (r) => <span className="text-link">{r.stock_number ?? "—"}</span>,
    },
    { key: "name", header: "Name", filterable: true },
    { key: "category", header: "Kategorie", filterable: true },
    {
      key: "stock", header: "Bestand", className: "text-right",
      render: (r) => {
        const s = Number(r.stock ?? 0);
        return (
          <span className="inline-flex items-center justify-end gap-1.5">
            {s < 0 && <AlertTriangle className="h-4 w-4 text-orange-500" />}
            {fmtNumber(s)}
          </span>
        );
      },
    },
    {
      key: "planned_stock", header: "Sollbestand", className: "text-right",
      render: (r) => fmtNumber(Number(r.planned_stock ?? 0)),
    },
    {
      key: "actions", header: "Aktionen", sortable: false, className: "text-right",
      render: (r) => (
        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="secondary" className="gap-1" onClick={() => openMove(r, "einbuchung")}>
            <ArrowDownToLine className="h-3.5 w-3.5" /> Einbuchen
          </Button>
          <Button size="sm" variant="secondary" className="gap-1" onClick={() => openMove(r, "ausbuchung")}>
            <ArrowUpFromLine className="h-3.5 w-3.5" /> Ausbuchen
          </Button>
        </div>
      ),
    },
  ];

  const hasNegative = data.some((r) => Number(r.stock ?? 0) < 0);

  return (
    <div>
      <PageHeader
        title="Lager"
        subtitle="Lagerverwaltung"
        actions={
          <Button onClick={() => { setEdit(null); setItemOpen(true); }} className="gap-1.5">
            <Plus className="h-4 w-4" /> Lagerartikel
          </Button>
        }
      />

      {hasNegative && (
        <div className="mb-4 flex items-center gap-2">
          <Badge variant="secondary" className="gap-1.5 text-orange-600">
            <AlertTriangle className="h-3.5 w-3.5" /> Es gibt Lagerartikel mit negativem Bestand
          </Badge>
        </div>
      )}

      <DataTable
        data={data}
        columns={columns}
        loading={isLoading}
        getRowId={(r) => r.id}
        onRowClick={(r) => { setEdit(r); setItemOpen(true); }}
      />

      <StockItemDialog open={itemOpen} onOpenChange={setItemOpen} item={edit} />
      <MovementDialog open={moveOpen} onOpenChange={setMoveOpen} item={moveItem} type={moveType} />
    </div>
  );
}
