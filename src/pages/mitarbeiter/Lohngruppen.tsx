import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { fmtEUR } from "@/lib/format";
import {
  useWageGroups, useUpsertWageGroup, useDeleteWageGroup, type WageGroup,
} from "@/hooks/queries/useEmployees";
import { Plus, Trash2 } from "lucide-react";

function WageGroupDialog({
  open, onOpenChange, group,
}: { open: boolean; onOpenChange: (o: boolean) => void; group: WageGroup | null }) {
  const upsert = useUpsertWageGroup();
  const [f, setF] = useState<Partial<WageGroup>>({});

  useEffect(() => {
    if (open) setF(group ?? { name: "", self_cost: 0, total_cost: 0 });
  }, [open, group]);

  const set = (k: keyof WageGroup, v: unknown) => setF((p) => ({ ...p, [k]: v }));
  const num = (v: string) => (v === "" ? 0 : Number(v.replace(",", ".")));

  const save = async () => {
    if (!f.name?.trim()) return toast.error("Bitte einen Namen angeben.");
    try {
      await upsert.mutateAsync(f);
      toast.success(group ? "Lohngruppe aktualisiert" : "Lohngruppe angelegt");
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{group ? "Lohngruppe bearbeiten" : "Neue Lohngruppe"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={f.name ?? ""} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Lohnselbstkosten (€)</Label>
            <Input
              value={String(f.self_cost ?? 0)}
              onChange={(e) => set("self_cost", num(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Lohngesamtkosten (€)</Label>
            <Input
              value={String(f.total_cost ?? 0)}
              onChange={(e) => set("total_cost", num(e.target.value))}
            />
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

export default function Lohngruppen() {
  const { data = [], isLoading } = useWageGroups();
  const del = useDeleteWageGroup();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<WageGroup | null>(null);

  const remove = async (id: string) => {
    try {
      await del.mutateAsync(id);
      toast.success("Lohngruppe gelöscht");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const columns: Column<WageGroup>[] = [
    {
      key: "name", header: "Name", filterable: true,
      render: (r) => <span className="text-link">{r.name}</span>,
    },
    {
      key: "self_cost", header: "Lohnselbstkosten", className: "text-right",
      accessor: (r) => Number(r.self_cost ?? 0),
      render: (r) => fmtEUR(Number(r.self_cost ?? 0)),
    },
    {
      key: "total_cost", header: "Lohngesamtkosten", className: "text-right",
      accessor: (r) => Number(r.total_cost ?? 0),
      render: (r) => fmtEUR(Number(r.total_cost ?? 0)),
    },
    {
      key: "actions", header: "", sortable: false, width: "56px", className: "text-right",
      render: (r) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={(e) => { e.stopPropagation(); remove(r.id); }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Lohngruppen"
        subtitle="Verwaltung der Lohngruppen"
        actions={
          <Button onClick={() => { setEdit(null); setOpen(true); }} className="gap-1.5">
            <Plus className="h-4 w-4" /> Lohngruppe
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

      <WageGroupDialog open={open} onOpenChange={setOpen} group={edit} />
    </div>
  );
}
