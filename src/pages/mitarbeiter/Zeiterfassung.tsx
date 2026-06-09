import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { fmtDate, fmtNumber, toISODate } from "@/lib/format";
import {
  useTimeEntries, useUpsertTimeEntry, useConfirmTimeEntry, useTimeCategories,
  type TimeEntry,
} from "@/hooks/queries/useTime";
import { useEmployees } from "@/hooks/queries/useEmployees";
import { useProjects } from "@/hooks/queries/useProjects";
import { Plus, Check } from "lucide-react";

type Range = "heute" | "woche" | "monat" | "jahr";

const RANGES: { v: Range; l: string }[] = [
  { v: "heute", l: "Heute" },
  { v: "woche", l: "Diese Woche" },
  { v: "monat", l: "Dieser Monat" },
  { v: "jahr", l: "Dieses Jahr" },
];

const STATUS_LABEL: Record<string, string> = {
  vorlaeufig: "Vorläufig",
  eingereicht: "Eingereicht",
  bestaetigt: "Bestätigt",
  geloescht: "Gelöscht",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  vorlaeufig: "outline",
  eingereicht: "secondary",
  bestaetigt: "default",
};

function rangeStart(r: Range): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (r === "heute") return d;
  if (r === "woche") {
    const dow = (d.getDay() + 6) % 7; // Montag = 0
    d.setDate(d.getDate() - dow);
    return d;
  }
  if (r === "monat") { d.setDate(1); return d; }
  d.setMonth(0, 1); // jahr
  return d;
}

function TimeEntryDialog({
  open, onOpenChange, employees, projects, categories,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  employees: { id: string; label: string }[];
  projects: { id: string; label: string }[];
  categories: { id: string; label: string }[];
}) {
  const upsert = useUpsertTimeEntry();
  const [f, setF] = useState<Partial<TimeEntry>>({});
  useEffect(() => {
    if (open) setF({ entry_date: toISODate(), duration_minutes: 0, status: "vorlaeufig" });
  }, [open]);
  const set = (k: keyof TimeEntry, v: unknown) => setF((p) => ({ ...p, [k]: v }));
  const num = (v: string) => (v === "" ? 0 : Number(v.replace(",", ".")));

  const save = async () => {
    if (!f.employee_id) return toast.error("Bitte einen Mitarbeiter wählen.");
    if (!f.entry_date) return toast.error("Bitte ein Datum angeben.");
    try {
      await upsert.mutateAsync(f);
      toast.success("Zeiteintrag gespeichert");
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Zeiteintrag erstellen</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4 pt-1">
          <div className="col-span-2 space-y-1.5">
            <Label>Mitarbeiter</Label>
            <Select value={f.employee_id ?? ""} onValueChange={(v) => set("employee_id", v)}>
              <SelectTrigger><SelectValue placeholder="Mitarbeiter wählen" /></SelectTrigger>
              <SelectContent>
                {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Projekt</Label>
            <Select value={f.project_id ?? ""} onValueChange={(v) => set("project_id", v)}>
              <SelectTrigger><SelectValue placeholder="Projekt wählen (optional)" /></SelectTrigger>
              <SelectContent>
                {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Kategorie</Label>
            <Select value={f.category_id ?? ""} onValueChange={(v) => set("category_id", v)}>
              <SelectTrigger><SelectValue placeholder="Kategorie wählen (optional)" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Datum</Label>
            <Input type="date" value={f.entry_date ?? ""} onChange={(e) => set("entry_date", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Dauer (Minuten)</Label>
            <Input value={String(f.duration_minutes ?? 0)} onChange={(e) => set("duration_minutes", num(e.target.value))} />
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

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-light">{value}</p>
    </Card>
  );
}

export default function Zeiterfassung() {
  const { data: entries = [], isLoading } = useTimeEntries();
  const { data: employees = [] } = useEmployees();
  const { data: projects = [] } = useProjects();
  const { data: categories = [] } = useTimeCategories();
  const confirm = useConfirmTimeEntry();
  const [range, setRange] = useState<Range>("woche");
  const [open, setOpen] = useState(false);

  const empName = useMemo(() => {
    const m = new Map<string, string>();
    for (const e of employees) {
      m.set(e.id, [e.first_name, e.last_name].filter(Boolean).join(" ") || e.email || "—");
    }
    return m;
  }, [employees]);

  const catName = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of categories) m.set(c.id, c.name);
    return m;
  }, [categories]);

  const empOptions = useMemo(
    () => employees.map((e) => ({ id: e.id, label: [e.first_name, e.last_name].filter(Boolean).join(" ") || e.email || "—" })),
    [employees],
  );
  const projOptions = useMemo(
    () => projects.map((p) => ({ id: p.id, label: p.name || `Projekt ${p.project_number}` })),
    [projects],
  );
  const catOptions = useMemo(
    () => categories.map((c) => ({ id: c.id, label: c.name })),
    [categories],
  );

  const rows = useMemo(() => {
    const start = rangeStart(range);
    const startISO = toISODate(start);
    return entries.filter((e) => (e.entry_date ?? "") >= startISO);
  }, [entries, range]);

  const kpi = useMemo(() => {
    let minutes = 0;
    let open = 0;
    let confirmed = 0;
    for (const e of rows) {
      minutes += Number(e.duration_minutes ?? 0);
      if (e.status === "bestaetigt") confirmed += 1;
      else open += 1;
    }
    return { hours: minutes / 60, count: rows.length, open, confirmed };
  }, [rows]);

  const columns: Column<TimeEntry>[] = [
    {
      key: "employee_id", header: "Mitarbeiter", filterable: true,
      accessor: (r) => (r.employee_id ? empName.get(r.employee_id) ?? "" : ""),
      render: (r) => (r.employee_id ? empName.get(r.employee_id) ?? "—" : "—"),
    },
    {
      key: "entry_date", header: "Datum",
      accessor: (r) => r.entry_date ?? "",
      render: (r) => fmtDate(r.entry_date),
    },
    {
      key: "duration_minutes", header: "Dauer (h)", className: "text-right",
      accessor: (r) => Number(r.duration_minutes ?? 0),
      render: (r) => fmtNumber(Number(r.duration_minutes ?? 0) / 60),
    },
    {
      key: "category_id", header: "Kategorie", filterable: true,
      accessor: (r) => (r.category_id ? catName.get(r.category_id) ?? "" : ""),
      render: (r) => (r.category_id ? catName.get(r.category_id) ?? "—" : "—"),
    },
    {
      key: "status", header: "Status",
      render: (r) => {
        const s = r.status ?? "vorlaeufig";
        return <Badge variant={STATUS_VARIANT[s] ?? "outline"}>{STATUS_LABEL[s] ?? s}</Badge>;
      },
    },
    {
      key: "actions", header: "", sortable: false, width: "140px",
      render: (r) =>
        r.status === "bestaetigt" ? null : (
          <Button
            size="sm"
            variant="secondary"
            className="gap-1.5"
            disabled={confirm.isPending}
            onClick={async () => {
              try {
                await confirm.mutateAsync(r.id);
                toast.success("Eintrag bestätigt");
              } catch (e) {
                toast.error((e as Error).message);
              }
            }}
          >
            <Check className="h-3.5 w-3.5" /> Bestätigen
          </Button>
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Zeiterfassung"
        subtitle="Verwaltung der erfassten Arbeitszeiten"
        actions={
          <Button onClick={() => setOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Eintrag
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {RANGES.map((r) => (
          <Button
            key={r.v}
            size="sm"
            variant={range === r.v ? "default" : "secondary"}
            onClick={() => setRange(r.v)}
          >
            {r.l}
          </Button>
        ))}
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Erfasste Stunden" value={`${fmtNumber(kpi.hours)} h`} />
        <KpiCard label="Anzahl Einträge" value={String(kpi.count)} />
        <KpiCard label="Offen / Bestätigt" value={`${kpi.open} / ${kpi.confirmed}`} />
      </div>

      <DataTable
        data={rows}
        columns={columns}
        loading={isLoading}
        getRowId={(r) => r.id}
      />

      <TimeEntryDialog
        open={open}
        onOpenChange={setOpen}
        employees={empOptions}
        projects={projOptions}
        categories={catOptions}
      />
    </div>
  );
}
