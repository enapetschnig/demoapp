import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { fmtNumber } from "@/lib/format";
import { useSalesPrices, useUpsertSalesPrice, type SalesPrice } from "@/hooks/queries/useCatalog";
import { Plus } from "lucide-react";

function PriceDialog({ open, onOpenChange, price }: { open: boolean; onOpenChange: (o: boolean) => void; price?: SalesPrice | null }) {
  const upsert = useUpsertSalesPrice();
  const [f, setF] = useState<Partial<SalesPrice>>({});
  useEffect(() => { if (open) setF(price ?? { markup_percent: 0, is_standard: false }); }, [open, price]);
  const set = (k: keyof SalesPrice, v: unknown) => setF((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!f.name) return toast.error("Bitte einen Namen angeben.");
    try { await upsert.mutateAsync(f); toast.success("Verkaufspreis gespeichert"); onOpenChange(false); }
    catch (e) { toast.error((e as Error).message); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{price ? "Verkaufspreis bearbeiten" : "Neuer Verkaufspreis"}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5"><Label>Name</Label><Input value={f.name ?? ""} onChange={(e) => set("name", e.target.value)} placeholder="VK1" /></div>
          <div className="space-y-1.5"><Label>Aufschlag auf Einkaufspreis (%)</Label><Input value={String(f.markup_percent ?? 0)} onChange={(e) => set("markup_percent", Number(e.target.value.replace(",", ".")) || 0)} /></div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={!!f.is_standard} onCheckedChange={(v) => set("is_standard", !!v)} /> Als Standard verwenden
          </label>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button onClick={save} disabled={upsert.isPending}>Speichern</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Verkaufspreise() {
  const { data = [], isLoading } = useSalesPrices();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<SalesPrice | null>(null);

  const columns: Column<SalesPrice>[] = [
    { key: "name", header: "Name", render: (r) => (
      <span className="flex items-center gap-2">{r.name}{r.is_standard && <Badge variant="secondary">Standard</Badge>}</span>
    ) },
    { key: "markup_percent", header: "Formel", sortable: false, render: (r) => `Einkaufspreis + ${fmtNumber(Number(r.markup_percent))}%` },
  ];

  return (
    <div>
      <PageHeader title="Verkaufspreise" subtitle="Verwaltung für Artikel"
        actions={<Button onClick={() => { setEdit(null); setOpen(true); }} className="gap-1.5"><Plus className="h-4 w-4" /> Verkaufspreis</Button>} />
      <DataTable data={data} columns={columns} loading={isLoading} getRowId={(r) => r.id}
        onRowClick={(r) => { setEdit(r); setOpen(true); }} />
      <PriceDialog open={open} onOpenChange={setOpen} price={edit} />
    </div>
  );
}
