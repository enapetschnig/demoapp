import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { fmtDateTime } from "@/lib/format";
import {
  useAppointments, useUpsertAppointment, useAppointmentCategories,
  type Appointment,
} from "@/hooks/queries/usePlanning";
import { useEmployees } from "@/hooks/queries/useEmployees";
import { useProjects } from "@/hooks/queries/useProjects";
import { Plus } from "lucide-react";

const NONE = "__none__";

// timestamptz (ISO) -> Wert für <input type="datetime-local"> (lokale Zeit, ohne Zone)
function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// datetime-local Wert -> ISO (timestamptz)
function fromLocalInput(v: string): string {
  return v ? new Date(v).toISOString() : "";
}

export function AppointmentDialog({
  open, onOpenChange, appointment, defaults,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  appointment?: Appointment | null;
  defaults?: Partial<Appointment>;
}) {
  const upsert = useUpsertAppointment();
  const { data: categories = [] } = useAppointmentCategories();
  const { data: employees = [] } = useEmployees();
  const { data: projects = [] } = useProjects();

  const [f, setF] = useState<Partial<Appointment>>({});

  useEffect(() => {
    if (!open) return;
    if (appointment) setF(appointment);
    else {
      const now = new Date();
      const start = defaults?.start_at ? new Date(defaults.start_at) : now;
      const end = defaults?.end_at ? new Date(defaults.end_at) : new Date(start.getTime() + 60 * 60 * 1000);
      setF({
        title: "",
        start_at: start.toISOString(),
        end_at: end.toISOString(),
        ...defaults,
      });
    }
  }, [open, appointment, defaults]);

  const set = (k: keyof Appointment, v: unknown) => setF((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!f.title?.trim()) return toast.error("Bitte einen Titel angeben.");
    if (!f.start_at || !f.end_at) return toast.error("Bitte Start und Ende angeben.");
    try {
      await upsert.mutateAsync(f);
      toast.success(appointment ? "Termin aktualisiert" : "Termin angelegt");
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{appointment ? "Termin bearbeiten" : "Neuer Termin"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 pt-1">
          <div className="col-span-2 space-y-1.5">
            <Label>Titel</Label>
            <Input value={f.title ?? ""} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Kategorie</Label>
            <Select
              value={f.category_id ?? NONE}
              onValueChange={(v) => set("category_id", v === NONE ? null : v)}
            >
              <SelectTrigger><SelectValue placeholder="Keine" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Keine</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Mitarbeiter</Label>
            <Select
              value={f.assigned_to ?? NONE}
              onValueChange={(v) => set("assigned_to", v === NONE ? null : v)}
            >
              <SelectTrigger><SelectValue placeholder="Niemand" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Niemand</SelectItem>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {[e.first_name, e.last_name].filter(Boolean).join(" ") || e.email || "Unbenannt"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Projekt</Label>
            <Select
              value={f.project_id ?? NONE}
              onValueChange={(v) => set("project_id", v === NONE ? null : v)}
            >
              <SelectTrigger><SelectValue placeholder="Kein Projekt" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Kein Projekt</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {`#${p.project_number}${p.name ? " · " + p.name : ""}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Start</Label>
            <Input
              type="datetime-local"
              value={toLocalInput(f.start_at)}
              onChange={(e) => set("start_at", fromLocalInput(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Ende</Label>
            <Input
              type="datetime-local"
              value={toLocalInput(f.end_at)}
              onChange={(e) => set("end_at", fromLocalInput(e.target.value))}
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Notiz</Label>
            <Textarea rows={3} value={f.note ?? ""} onChange={(e) => set("note", e.target.value)} />
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

export default function Termine() {
  const { data = [], isLoading } = useAppointments();
  const { data: categories = [] } = useAppointmentCategories();
  const { data: employees = [] } = useEmployees();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Appointment | null>(null);

  const catName = (id: string | null) => categories.find((c) => c.id === id)?.name ?? "—";
  const empName = (id: string | null) => {
    const e = employees.find((x) => x.id === id);
    if (!e) return "—";
    return [e.first_name, e.last_name].filter(Boolean).join(" ") || e.email || "—";
  };

  const columns: Column<Appointment>[] = [
    {
      key: "start_at", header: "Start",
      accessor: (r) => r.start_at,
      render: (r) => fmtDateTime(r.start_at),
    },
    {
      key: "end_at", header: "Ende",
      accessor: (r) => r.end_at,
      render: (r) => fmtDateTime(r.end_at),
    },
    {
      key: "title", header: "Titel", filterable: true,
      render: (r) => <span className="text-link">{r.title}</span>,
    },
    {
      key: "category_id", header: "Kategorie",
      accessor: (r) => catName(r.category_id),
      render: (r) => <Badge variant="secondary">{catName(r.category_id)}</Badge>,
    },
    {
      key: "assigned_to", header: "Mitarbeiter",
      accessor: (r) => empName(r.assigned_to),
      render: (r) => empName(r.assigned_to),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Termine"
        subtitle="Alle geplanten Termine"
        actions={
          <Button onClick={() => { setEdit(null); setOpen(true); }} className="gap-1.5">
            <Plus className="h-4 w-4" /> Termin
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

      <AppointmentDialog open={open} onOpenChange={setOpen} appointment={edit} />
    </div>
  );
}
