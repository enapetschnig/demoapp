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
  useChecklists,
  useUpsertChecklist,
  useDeleteChecklist,
  type Checklist,
} from "@/hooks/queries/useAdmin";
import { Plus, Trash2, X } from "lucide-react";

// items jsonb → string[] robust einlesen.
function readItems(items: Checklist["items"]): string[] {
  if (Array.isArray(items)) return items.map((i) => String(i));
  return [];
}

function ChecklistDialog({
  open, onOpenChange, checklist, onDeleted,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  checklist?: Checklist | null;
  onDeleted?: () => void;
}) {
  const upsert = useUpsertChecklist();
  const del = useDeleteChecklist();
  const [name, setName] = useState("");
  const [items, setItems] = useState<string[]>([]);
  const [newItem, setNewItem] = useState("");

  useEffect(() => {
    if (open) {
      setName(checklist?.name ?? "");
      setItems(readItems(checklist?.items ?? []));
      setNewItem("");
    }
  }, [open, checklist]);

  const addItem = () => {
    const v = newItem.trim();
    if (!v) return;
    setItems((p) => [...p, v]);
    setNewItem("");
  };
  const removeItem = (idx: number) => setItems((p) => p.filter((_, i) => i !== idx));

  const save = async () => {
    if (!name.trim()) return toast.error("Bitte einen Namen angeben.");
    try {
      await upsert.mutateAsync({ id: checklist?.id, name: name.trim(), items });
      toast.success("Checkliste gespeichert");
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const remove = async () => {
    if (!checklist?.id) return;
    try {
      await del.mutateAsync(checklist.id);
      toast.success("Checkliste gelöscht");
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
          <DialogTitle>{checklist ? "Checkliste bearbeiten" : "Checkliste erstellen"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 pt-2">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Punkte</Label>
            <div className="flex gap-2">
              <Input
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addItem(); } }}
                placeholder="Punkt hinzufügen…"
              />
              <Button type="button" variant="secondary" className="gap-1.5" onClick={addItem}>
                <Plus className="h-4 w-4" /> Hinzufügen
              </Button>
            </div>
            <div className="mt-2 space-y-1.5">
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">Noch keine Punkte</p>
              ) : (
                items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between rounded-md border px-3 py-1.5 text-sm">
                    <span>{item}</span>
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeItem(i)}>
                      <X className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
          {checklist ? (
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

export default function Checklisten() {
  const { data = [], isLoading } = useChecklists();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Checklist | null>(null);

  const columns: Column<Checklist>[] = [
    { key: "name", header: "Name", filterable: true, render: (r) => <span className="text-link">{r.name}</span> },
    {
      key: "items", header: "Punkte", sortable: false,
      accessor: (r) => readItems(r.items).length,
      render: (r) => <Badge variant="outline">{readItems(r.items).length}</Badge>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Checklisten"
        subtitle="Wiederkehrende Prüfpunkte"
        actions={
          <Button onClick={() => { setEdit(null); setOpen(true); }} className="gap-1.5">
            <Plus className="h-4 w-4" /> Checkliste
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
      <ChecklistDialog open={open} onOpenChange={setOpen} checklist={edit} onDeleted={() => setEdit(null)} />
    </div>
  );
}
