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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  useProjectTypesAdmin,
  useUpsertProjectStep,
  useDeleteProjectStep,
  type ProjectTypeWithSteps,
  type ProjectStep,
} from "@/hooks/queries/useAdminConfig";
import { Plus, Trash2 } from "lucide-react";

const BASE_STATUS = [
  { v: "offen", l: "Offen" },
  { v: "in_arbeit", l: "In Arbeit" },
  { v: "abgeschlossen", l: "Abgeschlossen" },
  { v: "storniert", l: "Storniert" },
];
const baseLabel = (v: string) => BASE_STATUS.find((b) => b.v === v)?.l ?? v;

function StepDialog({
  open, onOpenChange, projectTypeId, step, nextSort,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  projectTypeId: string;
  step?: ProjectStep | null;
  nextSort: number;
}) {
  const upsert = useUpsertProjectStep();
  const [f, setF] = useState<Partial<ProjectStep>>({});
  useEffect(() => {
    if (open) setF(step ?? { name: "", base_status: "offen", status_code: 0, sort_order: nextSort });
  }, [open, step, nextSort]);
  const set = (k: keyof ProjectStep, v: unknown) => setF((p) => ({ ...p, [k]: v }));
  const num = (v: string) => (v === "" ? 0 : Number(v.replace(",", ".")));

  const save = async () => {
    if (!f.name) return toast.error("Bitte einen Schrittnamen angeben.");
    try {
      await upsert.mutateAsync({
        id: step?.id,
        project_type_id: projectTypeId,
        name: f.name,
        base_status: f.base_status ?? "offen",
        status_code: Number(f.status_code ?? 0),
        sort_order: Number(f.sort_order ?? nextSort),
      });
      toast.success("Schritt gespeichert");
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{step ? "Schritt bearbeiten" : "Schritt hinzufügen"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 pt-2">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={f.name ?? ""} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Basis-Status</Label>
            <Select value={f.base_status ?? "offen"} onValueChange={(v) => set("base_status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {BASE_STATUS.map((b) => <SelectItem key={b.v} value={b.v}>{b.l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Status-Code</Label>
              <Input value={String(f.status_code ?? 0)} onChange={(e) => set("status_code", num(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label>Reihenfolge</Label>
              <Input value={String(f.sort_order ?? 0)} onChange={(e) => set("sort_order", num(e.target.value))} />
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

function StepsEditor({
  open, onOpenChange, type,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  type: ProjectTypeWithSteps | null;
}) {
  const del = useDeleteProjectStep();
  const [stepOpen, setStepOpen] = useState(false);
  const [editStep, setEditStep] = useState<ProjectStep | null>(null);

  if (!type) return null;
  const steps = type.steps;
  const nextSort = steps.length ? Math.max(...steps.map((s) => s.sort_order)) + 1 : 0;

  const remove = async (id: string) => {
    try {
      await del.mutateAsync(id);
      toast.success("Schritt gelöscht");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Schritte: {type.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <div className="flex justify-end">
            <Button size="sm" className="gap-1.5" onClick={() => { setEditStep(null); setStepOpen(true); }}>
              <Plus className="h-4 w-4" /> Schritt
            </Button>
          </div>
          <div className="overflow-hidden rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Reihenfolge</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Basis-Status</th>
                  <th className="px-3 py-2">Status-Code</th>
                  <th className="px-3 py-2 text-right">Aktion</th>
                </tr>
              </thead>
              <tbody>
                {steps.length === 0 ? (
                  <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">Noch keine Schritte</td></tr>
                ) : (
                  [...steps].sort((a, b) => a.sort_order - b.sort_order).map((s) => (
                    <tr key={s.id} className="border-t hover:bg-muted/30">
                      <td className="px-3 py-2">{s.sort_order}</td>
                      <td className="px-3 py-2 cursor-pointer" onClick={() => { setEditStep(s); setStepOpen(true); }}>
                        <span className="text-link">{s.name}</span>
                      </td>
                      <td className="px-3 py-2"><Badge variant="secondary">{baseLabel(s.base_status)}</Badge></td>
                      <td className="px-3 py-2">{s.status_code}</td>
                      <td className="px-3 py-2 text-right">
                        <Button variant="ghost" size="icon" onClick={() => remove(s.id)} disabled={del.isPending}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Schließen</Button>
        </DialogFooter>
        <StepDialog
          open={stepOpen}
          onOpenChange={setStepOpen}
          projectTypeId={type.id}
          step={editStep}
          nextSort={nextSort}
        />
      </DialogContent>
    </Dialog>
  );
}

export default function Projekttypen() {
  const { data = [], isLoading } = useProjectTypesAdmin();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<ProjectTypeWithSteps | null>(null);

  // Aktiven Typ mit frischen Daten aus der Query synchron halten.
  const current = active ? data.find((t) => t.id === active.id) ?? active : null;

  const columns: Column<ProjectTypeWithSteps>[] = [
    {
      key: "name", header: "Name", filterable: true,
      render: (r) => (
        <span className="inline-flex items-center gap-2">
          {r.color && <span className="h-3 w-3 rounded-full" style={{ backgroundColor: r.color }} />}
          <span className="text-link">{r.name}</span>
        </span>
      ),
    },
    { key: "code", header: "Code", filterable: true, render: (r) => r.code ?? "—" },
    {
      key: "is_standard", header: "Standard",
      render: (r) => r.is_standard ? <Badge variant="secondary">Standard</Badge> : <span className="text-muted-foreground">—</span>,
    },
    {
      key: "steps", header: "Schritte", sortable: false,
      accessor: (r) => r.steps.length,
      render: (r) => <Badge variant="outline">{r.steps.length}</Badge>,
    },
    { key: "status", header: "Status", render: (r) => <Badge variant="secondary">{r.status}</Badge> },
  ];

  return (
    <div>
      <PageHeader title="Projekttypen" subtitle="Projekttypen & deren Bearbeitungsschritte" />
      <DataTable
        data={data}
        columns={columns}
        loading={isLoading}
        getRowId={(r) => r.id}
        onRowClick={(r) => { setActive(r); setOpen(true); }}
      />
      <StepsEditor open={open} onOpenChange={setOpen} type={current} />
    </div>
  );
}
