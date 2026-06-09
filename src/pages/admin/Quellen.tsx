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
import {
  useProjectSources,
  useUpsertProjectSource,
  useDeleteProjectSource,
  type ProjectSource,
} from "@/hooks/queries/useAdmin";
import { Plus, Trash2 } from "lucide-react";

function SourceDialog({
  open, onOpenChange, source, onDeleted,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  source?: ProjectSource | null;
  onDeleted?: () => void;
}) {
  const upsert = useUpsertProjectSource();
  const del = useDeleteProjectSource();
  const [name, setName] = useState("");
  useEffect(() => { if (open) setName(source?.name ?? ""); }, [open, source]);

  const save = async () => {
    if (!name.trim()) return toast.error("Bitte einen Namen angeben.");
    try {
      await upsert.mutateAsync({ id: source?.id, name: name.trim() });
      toast.success("Quelle gespeichert");
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const remove = async () => {
    if (!source?.id) return;
    try {
      await del.mutateAsync(source.id);
      toast.success("Quelle gelöscht");
      onOpenChange(false);
      onDeleted?.();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{source ? "Quelle bearbeiten" : "Quelle erstellen"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 pt-2">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
          {source ? (
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

export default function Quellen() {
  const { data = [], isLoading } = useProjectSources();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<ProjectSource | null>(null);

  const columns: Column<ProjectSource>[] = [
    { key: "name", header: "Name", filterable: true, render: (r) => <span className="text-link">{r.name}</span> },
  ];

  return (
    <div>
      <PageHeader
        title="Quellen"
        subtitle="Herkunft von Projekten / Anfragen"
        actions={
          <Button onClick={() => { setEdit(null); setOpen(true); }} className="gap-1.5">
            <Plus className="h-4 w-4" /> Quelle
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
      <SourceDialog open={open} onOpenChange={setOpen} source={edit} onDeleted={() => setEdit(null)} />
    </div>
  );
}
