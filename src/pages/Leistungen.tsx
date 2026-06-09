import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { fmtEUR } from "@/lib/format";
import { useServices, useUpsertService, type Service } from "@/hooks/queries/useCatalog";
import { Plus } from "lucide-react";

function ServiceDialog({ open, onOpenChange, service }: { open: boolean; onOpenChange: (o: boolean) => void; service?: Service | null }) {
  const upsert = useUpsertService();
  const [f, setF] = useState<Partial<Service>>({});
  useEffect(() => { if (open) setF(service ?? { unit: "Std", time_minutes: 60, vat_rate: 20, price: 0 }); }, [open, service]);
  const set = (k: keyof Service, v: unknown) => setF((p) => ({ ...p, [k]: v }));
  const num = (v: string) => (v === "" ? 0 : Number(v.replace(",", ".")));

  const save = async () => {
    if (!f.name) return toast.error("Bitte einen Namen angeben.");
    try { await upsert.mutateAsync(f); toast.success("Leistung gespeichert"); onOpenChange(false); }
    catch (e) { toast.error((e as Error).message); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>{service ? "Leistung bearbeiten" : "Leistung erstellen"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="col-span-2 space-y-1.5"><Label>Name</Label><Input value={f.name ?? ""} onChange={(e) => set("name", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Nummer</Label><Input value={f.service_number ?? ""} onChange={(e) => set("service_number", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Interner Name</Label><Input value={f.internal_name ?? ""} onChange={(e) => set("internal_name", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Zeit (Min.)</Label><Input value={String(f.time_minutes ?? 60)} onChange={(e) => set("time_minutes", num(e.target.value))} /></div>
          <div className="space-y-1.5"><Label>Einheit</Label><Input value={f.unit ?? ""} onChange={(e) => set("unit", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Preis (€)</Label><Input value={String(f.price ?? 0)} onChange={(e) => set("price", num(e.target.value))} /></div>
          <div className="space-y-1.5"><Label>MwSt. (%)</Label><Input value={String(f.vat_rate ?? 20)} onChange={(e) => set("vat_rate", num(e.target.value))} /></div>
          <div className="col-span-2 space-y-1.5"><Label>Beschreibung</Label><Textarea rows={2} value={f.description ?? ""} onChange={(e) => set("description", e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button onClick={save} disabled={upsert.isPending}>Speichern</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Leistungen() {
  const { data = [], isLoading } = useServices();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Service | null>(null);

  const columns: Column<Service>[] = [
    { key: "service_number", header: "#", filterable: true, render: (r) => <span className="text-link">{r.service_number ?? "—"}</span> },
    { key: "name", header: "Name", filterable: true },
    { key: "description", header: "Beschreibung", sortable: false },
    { key: "internal_name", header: "Interner Name" },
    { key: "time_minutes", header: "Zeit (Min.)", className: "text-right" },
    { key: "unit", header: "Einheit" },
    { key: "price", header: "Preis", className: "text-right", render: (r) => fmtEUR(Number(r.price)) },
    { key: "vat_rate", header: "MwSt", className: "text-right", render: (r) => `${r.vat_rate}%` },
  ];

  return (
    <div>
      <PageHeader title="Leistungen" subtitle="Verwaltung für Artikel"
        actions={<Button onClick={() => { setEdit(null); setOpen(true); }} className="gap-1.5"><Plus className="h-4 w-4" /> Leistung</Button>} />
      <DataTable data={data} columns={columns} loading={isLoading} getRowId={(r) => r.id}
        onRowClick={(r) => { setEdit(r); setOpen(true); }} />
      <ServiceDialog open={open} onOpenChange={setOpen} service={edit} />
    </div>
  );
}
