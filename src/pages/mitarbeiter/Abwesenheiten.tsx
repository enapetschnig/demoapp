import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { fmtDate, fmtNumber, toISODate } from "@/lib/format";
import {
  useAbsences, useUpsertAbsence, useSetAbsenceStatus, useAbsenceTypes,
  useEmployees, type Absence,
} from "@/hooks/queries/useEmployees";
import { Plus } from "lucide-react";

const STATUS_META: Record<string, { l: string; v: "secondary" | "default" | "destructive" | "outline" }> = {
  eingereicht: { l: "Eingereicht", v: "secondary" },
  genehmigt: { l: "Genehmigt", v: "default" },
  abgelehnt: { l: "Abgelehnt", v: "destructive" },
};

function AbsenceDialog({
  open, onOpenChange,
}: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const upsert = useUpsertAbsence();
  const { data: employees = [] } = useEmployees();
  const { data: types = [] } = useAbsenceTypes();
  const [f, setF] = useState<Partial<Absence>>({});

  useEffect(() => {
    if (open) {
      setF({
        start_date: toISODate(),
        end_date: toISODate(),
        days: 1,
        status: "eingereicht",
      });
    }
  }, [open]);

  const set = (k: keyof Absence, v: unknown) => setF((p) => ({ ...p, [k]: v }));
  const num = (v: string) => (v === "" ? 0 : Number(v.replace(",", ".")));

  const empName = (e: { first_name: string | null; last_name: string | null }) =>
    [e.first_name, e.last_name].filter(Boolean).join(" ").trim();

  const save = async () => {
    if (!f.employee_id) return toast.error("Bitte einen Mitarbeiter wählen.");
    if (!f.start_date || !f.end_date) return toast.error("Bitte Zeitraum angeben.");
    try {
      await upsert.mutateAsync(f);
      toast.success("Abwesenheitsantrag erstellt");
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Abwesenheitsantrag</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 pt-1">
          <div className="col-span-2 space-y-1.5">
            <Label>Mitarbeiter</Label>
            <Select value={f.employee_id ?? undefined} onValueChange={(v) => set("employee_id", v)}>
              <SelectTrigger><SelectValue placeholder="Mitarbeiter wählen" /></SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {empName(e) || e.email || e.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Art</Label>
            <Select value={f.type ?? undefined} onValueChange={(v) => set("type", v)}>
              <SelectTrigger><SelectValue placeholder="Art wählen" /></SelectTrigger>
              <SelectContent>
                {types.length === 0 ? (
                  <SelectItem value="Urlaub">Urlaub</SelectItem>
                ) : (
                  types.map((t) => (
                    <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Von</Label>
            <Input
              type="date"
              value={f.start_date ?? ""}
              onChange={(e) => set("start_date", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Bis</Label>
            <Input
              type="date"
              value={f.end_date ?? ""}
              onChange={(e) => set("end_date", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Tage</Label>
            <Input
              value={String(f.days ?? 0)}
              onChange={(e) => set("days", num(e.target.value))}
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Notiz</Label>
            <Textarea rows={2} value={f.note ?? ""} onChange={(e) => set("note", e.target.value)} />
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

export default function Abwesenheiten() {
  const { data = [], isLoading } = useAbsences();
  const { data: employees = [] } = useEmployees();
  const setStatus = useSetAbsenceStatus();
  const [tab, setTab] = useState("uebersicht");
  const [open, setOpen] = useState(false);

  const empName = useMemo(() => {
    const map = new Map<string, string>();
    for (const e of employees) {
      map.set(e.id, [e.first_name, e.last_name].filter(Boolean).join(" ").trim() || e.email || e.id);
    }
    return (id: string | null) => (id ? map.get(id) ?? "—" : "—");
  }, [employees]);

  const rows = useMemo(
    () => (tab === "genehmigen" ? data.filter((a) => (a.status ?? "eingereicht") === "eingereicht") : data),
    [data, tab],
  );

  const decide = async (id: string, status: string) => {
    try {
      await setStatus.mutateAsync({ id, status });
      toast.success(status === "genehmigt" ? "Antrag genehmigt" : "Antrag abgelehnt");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const columns: Column<Absence>[] = [
    {
      key: "employee", header: "Mitarbeiter", filterable: true,
      accessor: (r) => empName(r.employee_id),
      render: (r) => <span className="text-link">{empName(r.employee_id)}</span>,
    },
    {
      key: "zeitraum", header: "Zeitraum", sortable: false,
      accessor: (r) => r.start_date,
      render: (r) => `${fmtDate(r.start_date)} – ${fmtDate(r.end_date)}`,
    },
    { key: "type", header: "Art", filterable: true, render: (r) => r.type ?? "—" },
    {
      key: "days", header: "Tage", className: "text-right",
      accessor: (r) => Number(r.days ?? 0),
      render: (r) => fmtNumber(Number(r.days ?? 0), 1),
    },
    {
      key: "status", header: "Status",
      accessor: (r) => r.status ?? "eingereicht",
      render: (r) => {
        const m = STATUS_META[r.status ?? "eingereicht"] ?? { l: r.status ?? "—", v: "secondary" as const };
        return <Badge variant={m.v}>{m.l}</Badge>;
      },
    },
    {
      key: "actions", header: "", sortable: false, width: "200px", className: "text-right",
      render: (r) =>
        (r.status ?? "eingereicht") === "eingereicht" ? (
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={(e) => { e.stopPropagation(); decide(r.id, "genehmigt"); }}
            >
              Genehmigen
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={(e) => { e.stopPropagation(); decide(r.id, "abgelehnt"); }}
            >
              Ablehnen
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Abwesenheiten"
        subtitle="Urlaub & Abwesenheiten"
        actions={
          <Button onClick={() => setOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Abwesenheitsantrag
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="uebersicht">Übersicht</TabsTrigger>
          <TabsTrigger value="genehmigen">Genehmigen</TabsTrigger>
        </TabsList>
      </Tabs>

      <DataTable
        data={rows}
        columns={columns}
        loading={isLoading}
        getRowId={(r) => r.id}
      />

      <AbsenceDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
