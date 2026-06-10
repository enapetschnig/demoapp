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
  Tabs, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { fmtDate, fmtNumber, toISODate, parseDateSafe } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  useTimeEntries, useUpsertTimeEntry, useConfirmTimeEntry, useTimeCategories,
  type TimeEntry, type TimeCategory,
} from "@/hooks/queries/useTime";
import { useEmployees, useAbsences, type Absence } from "@/hooks/queries/useEmployees";
import { useProjects } from "@/hooks/queries/useProjects";
import { Plus, Check } from "lucide-react";

const ALL = "__all__";
const NONE = "__none__";
const WORK_HOURS_PER_DAY = 8;

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

function rangeEnd(r: Range): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (r === "heute") return d;
  if (r === "woche") {
    const dow = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - dow + 6);
    return d;
  }
  if (r === "monat") { d.setMonth(d.getMonth() + 1, 0); return d; }
  d.setMonth(11, 31); // jahr
  return d;
}

// Nettostunden eines Eintrags: (Dauer - Pause) / 60.
function netHours(e: TimeEntry): number {
  const net = Number(e.duration_minutes ?? 0) - Number(e.break_minutes ?? 0);
  return Math.max(0, net) / 60;
}

// Stunden als HH:MM (z. B. -1110:00) — entspricht der Darstellung in der Doku.
function fmtHM(hours: number): string {
  const neg = hours < 0;
  const total = Math.round(Math.abs(hours) * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${neg ? "-" : ""}${h}:${String(m).padStart(2, "0")}`;
}

// Anzahl Arbeitstage (Mo–Fr) im Zeitraum [startISO, endISO].
function workdaysBetween(startISO: string, endISO: string): number {
  const start = parseDateSafe(startISO);
  const end = parseDateSafe(endISO);
  if (!start || !end || start > end) return 0;
  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) count += 1;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

// Überlappende Tage einer Abwesenheit mit dem Zeitraum.
function absenceDaysInRange(a: Absence, startISO: string, endISO: string): number {
  const aStart = (a.start_date ?? "").slice(0, 10);
  const aEnd = (a.end_date ?? a.start_date ?? "").slice(0, 10);
  if (!aStart) return 0;
  const from = aStart > startISO ? aStart : startISO;
  const to = aEnd < endISO ? aEnd : endISO;
  if (from > to) return 0;
  const d1 = parseDateSafe(from);
  const d2 = parseDateSafe(to);
  if (!d1 || !d2) return 0;
  return Math.floor((d2.getTime() - d1.getTime()) / 86_400_000) + 1;
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
    if (open) setF({ entry_date: toISODate(), duration_minutes: 0, break_minutes: 0, status: "vorlaeufig" });
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
            <Select
              value={f.project_id ?? NONE}
              onValueChange={(v) => set("project_id", v === NONE ? null : v)}
            >
              <SelectTrigger><SelectValue placeholder="Projekt wählen (optional)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Kein Projekt</SelectItem>
                {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Kategorie</Label>
            <Select
              value={f.category_id ?? NONE}
              onValueChange={(v) => set("category_id", v === NONE ? null : v)}
            >
              <SelectTrigger><SelectValue placeholder="Kategorie wählen (optional)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Keine Kategorie</SelectItem>
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
          <div className="space-y-1.5">
            <Label>Pause (Minuten)</Label>
            <Input value={String(f.break_minutes ?? 0)} onChange={(e) => set("break_minutes", num(e.target.value))} />
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

function KpiCard({
  title, rows,
}: {
  title: string;
  rows: { label: string; value: string; negative?: boolean }[];
}) {
  return (
    <Card className="p-5">
      <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className="mt-3 space-y-2">
        {rows.map((r) => (
          <div key={r.label} className="flex items-baseline justify-between">
            <span className="text-xs uppercase text-muted-foreground">{r.label}</span>
            <span className={cn("text-xl font-light tabular-nums", r.negative && "text-destructive")}>
              {r.value} Std
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function Zeiterfassung() {
  const { data: entries = [], isLoading } = useTimeEntries();
  const { data: employees = [] } = useEmployees();
  const { data: projects = [] } = useProjects();
  const { data: categories = [] } = useTimeCategories();
  const { data: absences = [] } = useAbsences();
  const confirm = useConfirmTimeEntry();

  const [tab, setTab] = useState("zeiterfassung");
  const [range, setRange] = useState<Range>("jahr");
  const [start, setStart] = useState(() => toISODate(rangeStart("jahr")));
  const [end, setEnd] = useState(() => toISODate(rangeEnd("jahr")));
  const [employeeFilter, setEmployeeFilter] = useState<string>(ALL);
  const [open, setOpen] = useState(false);

  // Schnellfilter setzt Start/Ende; manuelle Eingabe überschreibt sie.
  const applyRange = (r: Range) => {
    setRange(r);
    setStart(toISODate(rangeStart(r)));
    setEnd(toISODate(rangeEnd(r)));
  };

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

  // Nicht arbeitszeitrelevante Kategorien (z. B. Pause) → Ausgleich.
  const nonWorkCats = useMemo(() => {
    const s = new Set<string>();
    for (const c of categories as TimeCategory[]) {
      if (c.work_relevant === false) s.add(c.id);
    }
    return s;
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

  // Einträge im Zeitraum (+ optional je Mitarbeiter).
  const rows = useMemo(() => {
    return entries.filter((e) => {
      const d = (e.entry_date ?? "").slice(0, 10);
      if (d < start || d > end) return false;
      if (employeeFilter !== ALL && e.employee_id !== employeeFilter) return false;
      return true;
    });
  }, [entries, start, end, employeeFilter]);

  // Abwesenheiten im Zeitraum (+ optional je Mitarbeiter).
  const rangeAbsences = useMemo(() => {
    return absences.filter((a) => {
      if (employeeFilter !== ALL && a.employee_id !== employeeFilter) return false;
      return absenceDaysInRange(a, start, end) > 0;
    });
  }, [absences, start, end, employeeFilter]);

  const kpi = useMemo(() => {
    // Zeiterfassung
    let beantragt = 0;
    let bewilligt = 0;
    let ausgleich = 0;
    for (const e of rows) {
      const h = netHours(e);
      beantragt += h;
      if (e.status === "bestaetigt") bewilligt += h;
      if (e.category_id && nonWorkCats.has(e.category_id)) ausgleich += h;
    }

    // Arbeitszeit – SOLL: Arbeitstage × 8h. Bei "Alle" je aktiver Mitarbeiter,
    // sonst für den gewählten Mitarbeiter.
    const activeCount = employeeFilter === ALL
      ? Math.max(1, employees.filter((e) => e.is_active).length)
      : 1;
    const soll = workdaysBetween(start, end) * WORK_HOURS_PER_DAY * activeCount;

    // Arbeitszeit – ABWESEND: Abwesenheitstage × 8h.
    let abwesendDays = 0;
    for (const a of rangeAbsences) abwesendDays += absenceDaysInRange(a, start, end);
    const abwesend = abwesendDays * WORK_HOURS_PER_DAY;

    // Zeitkonto – SALDO = BEWILLIGT - SOLL.
    const saldo = bewilligt - soll;

    return { beantragt, bewilligt, soll, abwesend, ausgleich, saldo };
  }, [rows, rangeAbsences, nonWorkCats, employees, employeeFilter, start, end]);

  // Stundenausgleich: je Mitarbeiter Soll / Ist (bewilligt) / Saldo.
  const balanceRows = useMemo(() => {
    const ist = new Map<string, number>();
    for (const e of rows) {
      if (e.status !== "bestaetigt" || !e.employee_id) continue;
      ist.set(e.employee_id, (ist.get(e.employee_id) ?? 0) + netHours(e));
    }
    const sollPerEmp = workdaysBetween(start, end) * WORK_HOURS_PER_DAY;
    const list = employeeFilter === ALL
      ? employees.filter((e) => e.is_active)
      : employees.filter((e) => e.id === employeeFilter);
    return list.map((e) => {
      const istH = ist.get(e.id) ?? 0;
      return {
        id: e.id,
        name: empName.get(e.id) ?? "—",
        soll: sollPerEmp,
        ist: istH,
        saldo: istH - sollPerEmp,
      };
    });
  }, [rows, employees, employeeFilter, empName, start, end]);

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
      accessor: (r) => netHours(r),
      render: (r) => fmtNumber(netHours(r)),
    },
    {
      key: "break_minutes", header: "Pause (min)", className: "text-right",
      accessor: (r) => Number(r.break_minutes ?? 0),
      render: (r) => fmtNumber(Number(r.break_minutes ?? 0), 0),
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
        r.status === "eingereicht" ? (
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
        ) : null,
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

      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="zeiterfassung">Zeiterfassung</TabsTrigger>
          <TabsTrigger value="stundenausgleich">Stundenausgleich</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Zeitraum-Schnellfilter + Datumsfelder + Mitarbeiter */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="flex flex-wrap gap-2">
          {RANGES.map((r) => (
            <Button
              key={r.v}
              size="sm"
              variant={range === r.v ? "default" : "secondary"}
              onClick={() => applyRange(r.v)}
            >
              {r.l}
            </Button>
          ))}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Start</Label>
          <Input type="date" className="h-9 w-[150px]" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Ende</Label>
          <Input type="date" className="h-9 w-[150px]" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Mitarbeiter</Label>
          <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
            <SelectTrigger className="h-9 w-[220px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Alle Mitarbeiter</SelectItem>
              {empOptions.map((e) => <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Drei KPI-Kacheln */}
      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        <KpiCard
          title="Zeiterfassung"
          rows={[
            { label: "Beantragt", value: fmtHM(kpi.beantragt) },
            { label: "Bewilligt", value: fmtHM(kpi.bewilligt) },
          ]}
        />
        <KpiCard
          title="Arbeitszeit"
          rows={[
            { label: "Soll", value: fmtHM(kpi.soll) },
            { label: "Abwesend", value: fmtHM(kpi.abwesend) },
          ]}
        />
        <KpiCard
          title="Zeitkonto"
          rows={[
            { label: "Ausgleich", value: fmtHM(kpi.ausgleich) },
            { label: "Saldo", value: fmtHM(kpi.saldo), negative: kpi.saldo < 0 },
          ]}
        />
      </div>

      {tab === "zeiterfassung" ? (
        <DataTable
          data={rows}
          columns={columns}
          loading={isLoading}
          getRowId={(r) => r.id}
        />
      ) : (
        <div className="overflow-x-auto rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Mitarbeiter</TableHead>
                <TableHead className="text-right">Soll</TableHead>
                <TableHead className="text-right">Ist</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {balanceRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                    Keine Mitarbeiter im Zeitraum
                  </TableCell>
                </TableRow>
              ) : (
                balanceRows.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>{b.name}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtHM(b.soll)} Std</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtHM(b.ist)} Std</TableCell>
                    <TableCell className={cn("text-right tabular-nums", b.saldo < 0 && "text-destructive")}>
                      {fmtHM(b.saldo)} Std
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

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
