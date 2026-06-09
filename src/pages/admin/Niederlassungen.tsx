import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  useBranches,
  useBranchEmployeeCounts,
  useUpsertBranch,
  useDeleteBranch,
  type Branch,
} from "@/hooks/queries/useAdmin";
import { Plus, Trash2 } from "lucide-react";

function BranchDialog({
  open, onOpenChange, branch, onDeleted,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  branch?: Branch | null;
  onDeleted?: () => void;
}) {
  const upsert = useUpsertBranch();
  const del = useDeleteBranch();
  const [f, setF] = useState<Partial<Branch>>({});
  useEffect(() => { if (open) setF(branch ?? { name: "" }); }, [open, branch]);
  const set = (k: keyof Branch, v: unknown) => setF((p) => ({ ...p, [k]: v }));
  const num = (v: string) => (v === "" ? null : Number(v.replace(",", ".")));

  const save = async () => {
    if (!f.name) return toast.error("Bitte einen Namen angeben.");
    try {
      await upsert.mutateAsync({
        id: branch?.id,
        name: f.name,
        address_street: f.address_street ?? null,
        address_zip: f.address_zip ?? null,
        address_city: f.address_city ?? null,
        radius_km: f.radius_km ?? null,
      });
      toast.success("Niederlassung gespeichert");
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const remove = async () => {
    if (!branch?.id) return;
    try {
      await del.mutateAsync(branch.id);
      toast.success("Niederlassung gelöscht");
      onOpenChange(false);
      onDeleted?.();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{branch ? "Niederlassung bearbeiten" : "Niederlassung erstellen"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 pt-2">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={f.name ?? ""} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Straße</Label>
            <Input value={f.address_street ?? ""} onChange={(e) => set("address_street", e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>PLZ</Label>
              <Input value={f.address_zip ?? ""} onChange={(e) => set("address_zip", e.target.value)} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Ort</Label>
              <Input value={f.address_city ?? ""} onChange={(e) => set("address_city", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Radius (km)</Label>
            <Input value={String(f.radius_km ?? "")} onChange={(e) => set("radius_km", num(e.target.value))} />
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
          {branch ? (
            <Button variant="ghost" className="gap-1.5 text-destructive" onClick={remove} disabled={del.isPending}>
              <Trash2 className="h-4 w-4" /> Löschen
            </Button>
          ) : <span />}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button onClick={save} disabled={upsert.isPending}>Speichern</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Niederlassungen() {
  const { data = [], isLoading } = useBranches();
  const { data: counts = {} } = useBranchEmployeeCounts();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Branch | null>(null);

  const columns: Column<Branch>[] = [
    { key: "name", header: "Name", filterable: true, render: (r) => <span className="text-link">{r.name}</span> },
    {
      key: "address", header: "Anschrift", filterable: true,
      accessor: (r) => [r.address_street, r.address_zip, r.address_city].filter(Boolean).join(" "),
      render: (r) => {
        const line = [r.address_street, [r.address_zip, r.address_city].filter(Boolean).join(" ")].filter(Boolean).join(", ");
        return line || <span className="text-muted-foreground">—</span>;
      },
    },
    {
      key: "radius_km", header: "Radius", className: "text-right",
      render: (r) => (r.radius_km != null ? `${Number(r.radius_km)} km` : <span className="text-muted-foreground">—</span>),
    },
    {
      key: "employees", header: "Mitarbeiteranzahl", className: "text-right", sortable: false,
      accessor: (r) => counts[r.id] ?? 0,
      render: (r) => <Badge variant="outline">{counts[r.id] ?? 0}</Badge>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Niederlassungen"
        subtitle="Standorte des Betriebs"
        actions={
          <Button onClick={() => { setEdit(null); setOpen(true); }} className="gap-1.5">
            <Plus className="h-4 w-4" /> Niederlassung
          </Button>
        }
      />
      <DataTable
        data={data}
        columns={columns}
        loading={isLoading}
        getRowId={(r) => r.id}
        onRowClick={(r) => { setEdit(r); setOpen(true); }}
      />
      <BranchDialog open={open} onOpenChange={setOpen} branch={edit} onDeleted={() => setEdit(null)} />
    </div>
  );
}
