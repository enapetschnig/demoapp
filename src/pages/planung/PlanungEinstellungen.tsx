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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  useResources, useUpsertResource, useDeleteResource,
  useAppointmentCategories, useUpsertAppointmentCategory, useDeleteAppointmentCategory,
  type Resource, type AppointmentCategory,
} from "@/hooks/queries/usePlanning";
import { useEmployees } from "@/hooks/queries/useEmployees";
import { Plus, Trash2 } from "lucide-react";

const NONE = "__none__";
const RESOURCE_TYPES = [
  { v: "mitarbeiter", l: "Mitarbeiter" },
  { v: "fahrzeug", l: "Fahrzeug" },
  { v: "allgemein", l: "Allgemein" },
];

/* ---------------- Ressourcen ---------------- */

function ResourceDialog({
  open, onOpenChange, resource,
}: { open: boolean; onOpenChange: (o: boolean) => void; resource: Resource | null }) {
  const upsert = useUpsertResource();
  const { data: employees = [] } = useEmployees();
  const [f, setF] = useState<Partial<Resource>>({});

  useEffect(() => {
    if (open) setF(resource ?? { name: "", type: "allgemein" });
  }, [open, resource]);

  const set = (k: keyof Resource, v: unknown) => setF((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!f.name?.trim()) return toast.error("Bitte einen Namen angeben.");
    try {
      await upsert.mutateAsync(f);
      toast.success(resource ? "Ressource aktualisiert" : "Ressource angelegt");
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{resource ? "Ressource bearbeiten" : "Neue Ressource"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={f.name ?? ""} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Typ</Label>
            <Select value={f.type ?? "allgemein"} onValueChange={(v) => set("type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {RESOURCE_TYPES.map((t) => (
                  <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Verknüpfter Mitarbeiter</Label>
            <Select
              value={f.profile_id ?? NONE}
              onValueChange={(v) => set("profile_id", v === NONE ? null : v)}
            >
              <SelectTrigger><SelectValue placeholder="Keiner" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Keiner</SelectItem>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {[e.first_name, e.last_name].filter(Boolean).join(" ") || e.email || "Unbenannt"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

function ResourcesTab() {
  const { data = [], isLoading } = useResources();
  const del = useDeleteResource();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Resource | null>(null);

  const typeLabel = (t: string | null) =>
    RESOURCE_TYPES.find((x) => x.v === t)?.l ?? t ?? "—";

  const remove = async (id: string) => {
    try { await del.mutateAsync(id); toast.success("Ressource gelöscht"); }
    catch (e) { toast.error((e as Error).message); }
  };

  const columns: Column<Resource>[] = [
    { key: "name", header: "Name", filterable: true, render: (r) => <span className="text-link">{r.name}</span> },
    {
      key: "type", header: "Typ",
      accessor: (r) => typeLabel(r.type),
      render: (r) => <Badge variant="secondary">{typeLabel(r.type)}</Badge>,
    },
    {
      key: "actions", header: "", sortable: false, width: "56px", className: "text-right",
      render: (r) => (
        <Button
          variant="ghost" size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={(e) => { e.stopPropagation(); remove(r.id); }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button onClick={() => { setEdit(null); setOpen(true); }} className="gap-1.5">
          <Plus className="h-4 w-4" /> Ressource
        </Button>
      </div>
      <DataTable
        data={data}
        columns={columns}
        loading={isLoading}
        getRowId={(r) => r.id}
        onRowClick={(r) => { setEdit(r); setOpen(true); }}
      />
      <ResourceDialog open={open} onOpenChange={setOpen} resource={edit} />
    </div>
  );
}

/* ---------------- Kategorien ---------------- */

function CategoryDialog({
  open, onOpenChange, category,
}: { open: boolean; onOpenChange: (o: boolean) => void; category: AppointmentCategory | null }) {
  const upsert = useUpsertAppointmentCategory();
  const [f, setF] = useState<Partial<AppointmentCategory>>({});

  useEffect(() => {
    if (open) setF(category ?? { name: "", color: "#3b82f6" });
  }, [open, category]);

  const set = (k: keyof AppointmentCategory, v: unknown) => setF((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!f.name?.trim()) return toast.error("Bitte einen Namen angeben.");
    try {
      await upsert.mutateAsync(f);
      toast.success(category ? "Kategorie aktualisiert" : "Kategorie angelegt");
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{category ? "Kategorie bearbeiten" : "Neue Kategorie"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={f.name ?? ""} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Farbe</Label>
            <div className="flex items-center gap-3">
              <Input
                type="color"
                className="h-10 w-16 p-1"
                value={f.color ?? "#3b82f6"}
                onChange={(e) => set("color", e.target.value)}
              />
              <Input
                className="flex-1"
                value={f.color ?? ""}
                onChange={(e) => set("color", e.target.value)}
                placeholder="#3b82f6"
              />
            </div>
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

function CategoriesTab() {
  const { data = [], isLoading } = useAppointmentCategories();
  const del = useDeleteAppointmentCategory();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<AppointmentCategory | null>(null);

  const remove = async (id: string) => {
    try { await del.mutateAsync(id); toast.success("Kategorie gelöscht"); }
    catch (e) { toast.error((e as Error).message); }
  };

  const columns: Column<AppointmentCategory>[] = [
    {
      key: "color", header: "Farbe", sortable: false, width: "72px",
      render: (r) => (
        <span
          className="inline-block h-4 w-4 rounded-full border"
          style={{ backgroundColor: r.color ?? "#64748b" }}
        />
      ),
    },
    { key: "name", header: "Name", filterable: true, render: (r) => <span className="text-link">{r.name}</span> },
    {
      key: "actions", header: "", sortable: false, width: "56px", className: "text-right",
      render: (r) => (
        <Button
          variant="ghost" size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={(e) => { e.stopPropagation(); remove(r.id); }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button onClick={() => { setEdit(null); setOpen(true); }} className="gap-1.5">
          <Plus className="h-4 w-4" /> Kategorie
        </Button>
      </div>
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

export default function PlanungEinstellungen() {
  return (
    <div>
      <PageHeader title="Einstellungen" subtitle="Planung konfigurieren" />
      <Tabs defaultValue="ressourcen">
        <TabsList className="mb-4">
          <TabsTrigger value="ressourcen">Ressourcen</TabsTrigger>
          <TabsTrigger value="kategorien">Kategorien</TabsTrigger>
        </TabsList>
        <TabsContent value="ressourcen"><ResourcesTab /></TabsContent>
        <TabsContent value="kategorien"><CategoriesTab /></TabsContent>
      </Tabs>
    </div>
  );
}
