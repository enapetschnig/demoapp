import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  useTimeCategories, useUpsertTimeCategory, type TimeCategory,
} from "@/hooks/queries/useTime";
import { Plus } from "lucide-react";

function CategoryDialog({
  open, onOpenChange, category,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  category?: TimeCategory | null;
}) {
  const upsert = useUpsertTimeCategory();
  const [f, setF] = useState<Partial<TimeCategory>>({});
  useEffect(() => {
    if (open) setF(category ?? { work_relevant: true, active: true });
  }, [open, category]);
  const set = (k: keyof TimeCategory, v: unknown) => setF((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!f.name) return toast.error("Bitte einen Namen angeben.");
    try {
      await upsert.mutateAsync(f);
      toast.success("Kategorie gespeichert");
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{category ? "Kategorie bearbeiten" : "Kategorie erstellen"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={f.name ?? ""} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Beschreibung</Label>
            <Textarea rows={3} value={f.description ?? ""} onChange={(e) => set("description", e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="work_relevant"
              checked={!!f.work_relevant}
              onCheckedChange={(v) => set("work_relevant", v === true)}
            />
            <Label htmlFor="work_relevant">Arbeitszeitrelevant</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="active"
              checked={f.active !== false}
              onCheckedChange={(v) => set("active", v === true)}
            />
            <Label htmlFor="active">Aktiv</Label>
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

export default function Zeitkategorien() {
  const { data = [], isLoading } = useTimeCategories();
  const upsert = useUpsertTimeCategory();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<TimeCategory | null>(null);

  const toggleActive = async (row: TimeCategory) => {
    try {
      await upsert.mutateAsync({ id: row.id, active: !(row.active !== false) });
      toast.success("Status aktualisiert");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const columns: Column<TimeCategory>[] = [
    { key: "name", header: "Name", filterable: true },
    { key: "description", header: "Beschreibung", filterable: true, render: (r) => r.description ?? "—" },
    {
      key: "work_relevant", header: "Arbeitszeitrelevant",
      accessor: (r) => (r.work_relevant ? "ja" : "nein"),
      render: (r) =>
        r.work_relevant
          ? <Badge variant="default">Ja</Badge>
          : <Badge variant="secondary">Nein</Badge>,
    },
    {
      key: "active", header: "Aktiv", sortable: false, width: "120px",
      render: (r) => (
        <Button
          size="sm"
          variant={r.active !== false ? "default" : "secondary"}
          disabled={upsert.isPending}
          onClick={(e) => { e.stopPropagation(); toggleActive(r); }}
        >
          {r.active !== false ? "Aktiv" : "Inaktiv"}
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Zeitkategorien"
        subtitle="Verwaltung der Kategorien für die Zeiterfassung"
        actions={
          <Button onClick={() => { setEdit(null); setOpen(true); }} className="gap-1.5">
            <Plus className="h-4 w-4" /> Kategorie
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
      <CategoryDialog open={open} onOpenChange={setOpen} category={edit} />
    </div>
  );
}
