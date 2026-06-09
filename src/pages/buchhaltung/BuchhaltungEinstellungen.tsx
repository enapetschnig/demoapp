import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { fmtEUR } from "@/lib/format";
import {
  useDunningLevels,
  useUpsertDunningLevel,
  useCostCenters,
  useUpsertCostCenter,
  useDeleteCostCenter,
  type DunningLevel,
  type CostCenter,
} from "@/hooks/queries/useDunning";
import { Plus, Trash2 } from "lucide-react";

const LEVEL_TYPES = [
  { v: "zahlungserinnerung", l: "Zahlungserinnerung" },
  { v: "mahnung", l: "Mahnung" },
];

function typeLabel(t: string): string {
  return LEVEL_TYPES.find((x) => x.v === t)?.l ?? t;
}

// ---------------------------------------------------------------------------
// Mahnwesen (dunning_levels)
// ---------------------------------------------------------------------------

function DunningLevelDialog({
  open, onOpenChange, level,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  level?: DunningLevel | null;
}) {
  const upsert = useUpsertDunningLevel();
  const [f, setF] = useState<Partial<DunningLevel>>({});

  useEffect(() => {
    if (open) {
      setF(level ?? {
        name: "",
        type: "zahlungserinnerung",
        level: 1,
        interval_days: 14,
        fee: 0,
        active: true,
        sort_order: 0,
      });
    }
  }, [open, level]);

  const set = (k: keyof DunningLevel, v: unknown) => setF((p) => ({ ...p, [k]: v }));
  const num = (v: string) => (v === "" ? 0 : Number(v.replace(",", ".")));

  const save = async () => {
    if (!f.name) return toast.error("Bitte eine Bezeichnung angeben.");
    try {
      await upsert.mutateAsync(f);
      toast.success("Mahnstufe gespeichert");
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{level ? "Mahnstufe bearbeiten" : "Mahnstufe erstellen"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 pt-1">
          <div className="col-span-2 space-y-1.5">
            <Label>Bezeichnung</Label>
            <Input value={f.name ?? ""} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Typ</Label>
            <Select value={f.type ?? "zahlungserinnerung"} onValueChange={(v) => set("type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LEVEL_TYPES.map((t) => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Stufe</Label>
            <Input value={String(f.level ?? 1)} onChange={(e) => set("level", num(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label>Frist (Tage)</Label>
            <Input value={String(f.interval_days ?? 0)} onChange={(e) => set("interval_days", num(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label>Mahngebühr (€)</Label>
            <Input value={String(f.fee ?? 0)} onChange={(e) => set("fee", num(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label>Sortierung</Label>
            <Input value={String(f.sort_order ?? 0)} onChange={(e) => set("sort_order", num(e.target.value))} />
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <Switch checked={!!f.active} onCheckedChange={(v) => set("active", v)} />
            <Label>Aktiv</Label>
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

function MahnwesenTab() {
  const { data = [], isLoading } = useDunningLevels();
  const upsert = useUpsertDunningLevel();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<DunningLevel | null>(null);

  const toggleActive = async (r: DunningLevel, active: boolean) => {
    try {
      await upsert.mutateAsync({ id: r.id, active });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const columns: Column<DunningLevel>[] = [
    {
      key: "level", header: "Stufe", width: "72px",
      accessor: (r) => Number(r.level),
      render: (r) => <span className="text-link">{r.level}</span>,
    },
    { key: "name", header: "Bezeichnung", filterable: true },
    {
      key: "type", header: "Typ",
      render: (r) => <Badge variant="secondary">{typeLabel(r.type)}</Badge>,
    },
    {
      key: "interval_days", header: "Frist (Tage)", className: "text-right",
      accessor: (r) => Number(r.interval_days),
      render: (r) => r.interval_days,
    },
    {
      key: "fee", header: "Mahngebühr", className: "text-right",
      accessor: (r) => Number(r.fee ?? 0),
      render: (r) => fmtEUR(Number(r.fee ?? 0)),
    },
    {
      key: "active", header: "Aktiv", sortable: false,
      render: (r) => (
        <Switch
          checked={!!r.active}
          onCheckedChange={(v) => toggleActive(r, v)}
          onClick={(e) => e.stopPropagation()}
        />
      ),
    },
  ];

  return (
    <div className="pt-3">
      <DataTable
        data={data}
        columns={columns}
        loading={isLoading}
        getRowId={(r) => r.id}
        onRowClick={(r) => { setEdit(r); setOpen(true); }}
        emptyText="Keine Mahnstufen definiert"
        toolbar={
          <Button onClick={() => { setEdit(null); setOpen(true); }} className="gap-1.5">
            <Plus className="h-4 w-4" /> Mahnstufe
          </Button>
        }
      />
      <DunningLevelDialog open={open} onOpenChange={setOpen} level={edit} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Kostenstellen (cost_centers)
// ---------------------------------------------------------------------------

function CostCenterDialog({
  open, onOpenChange, center,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  center?: CostCenter | null;
}) {
  const upsert = useUpsertCostCenter();
  const [f, setF] = useState<Partial<CostCenter>>({});

  useEffect(() => {
    if (open) setF(center ?? { name: "", number: "", color: "#888888" });
  }, [open, center]);

  const set = (k: keyof CostCenter, v: unknown) => setF((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!f.name) return toast.error("Bitte eine Bezeichnung angeben.");
    try {
      await upsert.mutateAsync(f);
      toast.success("Kostenstelle gespeichert");
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{center ? "Kostenstelle bearbeiten" : "Kostenstelle erstellen"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 pt-1">
          <div className="space-y-1.5">
            <Label>Nummer</Label>
            <Input value={f.number ?? ""} onChange={(e) => set("number", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Farbe</Label>
            <Input type="color" value={f.color ?? "#888888"} onChange={(e) => set("color", e.target.value)} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Bezeichnung</Label>
            <Input value={f.name ?? ""} onChange={(e) => set("name", e.target.value)} />
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

function KostenstellenTab() {
  const { data = [], isLoading } = useCostCenters();
  const del = useDeleteCostCenter();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<CostCenter | null>(null);

  const remove = async (r: CostCenter) => {
    try {
      await del.mutateAsync(r.id);
      toast.success("Kostenstelle gelöscht");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const columns: Column<CostCenter>[] = [
    {
      key: "number", header: "Nummer", filterable: true,
      render: (r) => <span className="text-link">{r.number ?? "—"}</span>,
    },
    { key: "name", header: "Bezeichnung", filterable: true },
    {
      key: "color", header: "Farbe", sortable: false,
      render: (r) => (
        <span className="inline-flex items-center gap-2">
          <span
            className="inline-block h-4 w-4 rounded-full border"
            style={{ backgroundColor: r.color ?? "transparent" }}
          />
          {r.color ?? "—"}
        </span>
      ),
    },
    {
      key: "actions", header: "", sortable: false, className: "text-right",
      render: (r) => (
        <Button
          size="sm"
          variant="ghost"
          disabled={del.isPending}
          onClick={(e) => { e.stopPropagation(); remove(r); }}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      ),
    },
  ];

  return (
    <div className="pt-3">
      <DataTable
        data={data}
        columns={columns}
        loading={isLoading}
        getRowId={(r) => r.id}
        onRowClick={(r) => { setEdit(r); setOpen(true); }}
        emptyText="Keine Kostenstellen definiert"
        toolbar={
          <Button onClick={() => { setEdit(null); setOpen(true); }} className="gap-1.5">
            <Plus className="h-4 w-4" /> Kostenstelle
          </Button>
        }
      />
      <CostCenterDialog open={open} onOpenChange={setOpen} center={edit} />
    </div>
  );
}

// ---------------------------------------------------------------------------

export default function BuchhaltungEinstellungen() {
  return (
    <div>
      <PageHeader
        title="Buchhaltung — Einstellungen"
        subtitle="Mahnwesen & Kostenstellen"
      />
      <Tabs defaultValue="mahnwesen">
        <TabsList>
          <TabsTrigger value="mahnwesen">Mahnwesen</TabsTrigger>
          <TabsTrigger value="kostenstellen">Kostenstellen</TabsTrigger>
        </TabsList>
        <TabsContent value="mahnwesen">
          <MahnwesenTab />
        </TabsContent>
        <TabsContent value="kostenstellen">
          <KostenstellenTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
