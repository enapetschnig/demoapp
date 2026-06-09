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
  useDocumentFolders,
  useUpsertDocumentFolder,
  useDeleteDocumentFolder,
  type DocumentFolder,
} from "@/hooks/queries/useAdmin";
import { Plus, Trash2, Lock } from "lucide-react";

function FolderDialog({
  open, onOpenChange, folder, onDeleted,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  folder?: DocumentFolder | null;
  onDeleted?: () => void;
}) {
  const upsert = useUpsertDocumentFolder();
  const del = useDeleteDocumentFolder();
  const [name, setName] = useState("");
  useEffect(() => { if (open) setName(folder?.name ?? ""); }, [open, folder]);
  const isSystem = !!folder?.is_system;

  const save = async () => {
    if (!name.trim()) return toast.error("Bitte einen Namen angeben.");
    try {
      await upsert.mutateAsync({ id: folder?.id, name: name.trim() });
      toast.success("Ordner gespeichert");
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const remove = async () => {
    if (!folder?.id) return;
    if (isSystem) return toast.error("System-Ordner können nicht gelöscht werden.");
    try {
      await del.mutateAsync(folder.id);
      toast.success("Ordner gelöscht");
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
          <DialogTitle>{folder ? "Ordner bearbeiten" : "Ordner erstellen"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 pt-2">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
          {folder && !isSystem ? (
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

export default function Ordner() {
  const { data = [], isLoading } = useDocumentFolders();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<DocumentFolder | null>(null);

  const columns: Column<DocumentFolder>[] = [
    { key: "name", header: "Name", filterable: true, render: (r) => <span className="text-link">{r.name}</span> },
    {
      key: "is_system", header: "Typ",
      accessor: (r) => (r.is_system ? "System" : "Eigen"),
      render: (r) => r.is_system
        ? <Badge variant="secondary" className="gap-1"><Lock className="h-3 w-3" /> System</Badge>
        : <Badge variant="outline">Eigen</Badge>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Ordner"
        subtitle="Dokumentenablage"
        actions={
          <Button onClick={() => { setEdit(null); setOpen(true); }} className="gap-1.5">
            <Plus className="h-4 w-4" /> Ordner
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
      <FolderDialog open={open} onOpenChange={setOpen} folder={edit} onDeleted={() => setEdit(null)} />
    </div>
  );
}
