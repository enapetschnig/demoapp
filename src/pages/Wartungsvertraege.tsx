import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { fmtDate } from "@/lib/format";
import { useContacts } from "@/hooks/queries/useContacts";
import {
  useMaintenanceContracts, useUpsertMaintenanceContract, useTeamMembers,
  type MaintenanceContract,
} from "@/hooks/queries/useMaintenance";
import { Plus } from "lucide-react";

const UNITS = [
  { v: "jahre", l: "Jahre" },
  { v: "monate", l: "Monate" },
  { v: "wochen", l: "Wochen" },
  { v: "tage", l: "Tage" },
];

const STATUS = [
  { v: "aktiv", l: "Aktiv" },
  { v: "inaktiv", l: "Inaktiv" },
  { v: "archiviert", l: "Archiviert" },
];

const STATUS_LABEL: Record<string, string> = {
  aktiv: "Aktiv", inaktiv: "Inaktiv", archiviert: "Archiviert",
};

const statusVariant = (s: string | null): "default" | "secondary" | "outline" =>
  s === "aktiv" ? "default" : s === "inaktiv" ? "secondary" : "outline";

const NONE = "__none__";

const unitLabel = (u: string | null) => UNITS.find((x) => x.v === u)?.l ?? u ?? "";

const customerName = (c: MaintenanceContract["customer"]) => {
  if (!c) return "—";
  const person = [c.first_name, c.last_name].filter(Boolean).join(" ");
  return c.company_name || person || "—";
};

const contactLabel = (c: { first_name: string | null; last_name: string | null; company_name: string | null }) => {
  const person = [c.first_name, c.last_name].filter(Boolean).join(" ");
  return c.company_name || person || "(ohne Name)";
};

type Form = Partial<MaintenanceContract>;

function ContractDialog({
  open, onOpenChange, contract,
}: { open: boolean; onOpenChange: (o: boolean) => void; contract?: MaintenanceContract | null }) {
  const upsert = useUpsertMaintenanceContract();
  const { data: contacts = [] } = useContacts();
  const { data: team = [] } = useTeamMembers();
  const [f, setF] = useState<Form>({});

  useEffect(() => {
    if (open) {
      setF(contract ?? {
        status: "aktiv", runtime_unit: "jahre", interval_unit: "monate",
      });
    }
  }, [open, contract]);

  const set = (k: keyof MaintenanceContract, v: unknown) => setF((p) => ({ ...p, [k]: v }));
  const num = (v: string) => (v === "" ? null : Number(v.replace(",", ".")));

  const save = async () => {
    if (!f.name) return toast.error("Bitte einen Namen angeben.");
    const payload: Form = {
      id: f.id,
      name: f.name,
      customer_id: f.customer_id ?? null,
      start_date: f.start_date || null,
      runtime_value: f.runtime_value ?? null,
      runtime_unit: f.runtime_unit ?? null,
      interval_value: f.interval_value ?? null,
      interval_unit: f.interval_unit ?? null,
      due_date: f.due_date || null,
      assigned_to: f.assigned_to ?? null,
      status: f.status ?? "aktiv",
    };
    try {
      await upsert.mutateAsync(payload);
      toast.success("Wartungsvertrag gespeichert");
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{contract ? "Wartungsvertrag bearbeiten" : "Wartungsvertrag erstellen"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 pt-1">
          <div className="space-y-1.5">
            <Label>Kunde</Label>
            <Select
              value={f.customer_id ?? NONE}
              onValueChange={(v) => set("customer_id", v === NONE ? null : v)}
            >
              <SelectTrigger><SelectValue placeholder="Kunde wählen" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— kein Kunde —</SelectItem>
                {contacts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{contactLabel(c)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={f.name ?? ""} onChange={(e) => set("name", e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Start-Datum</Label>
            <Input type="date" value={f.start_date ?? ""} onChange={(e) => set("start_date", e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Fällig am</Label>
            <Input type="date" value={f.due_date ?? ""} onChange={(e) => set("due_date", e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Laufzeit</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                className="w-24"
                value={f.runtime_value == null ? "" : String(f.runtime_value)}
                onChange={(e) => set("runtime_value", num(e.target.value))}
              />
              <Select value={f.runtime_unit ?? "jahre"} onValueChange={(v) => set("runtime_unit", v)}>
                <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => <SelectItem key={u.v} value={u.v}>{u.l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Intervall</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                className="w-24"
                value={f.interval_value == null ? "" : String(f.interval_value)}
                onChange={(e) => set("interval_value", num(e.target.value))}
              />
              <Select value={f.interval_unit ?? "monate"} onValueChange={(v) => set("interval_unit", v)}>
                <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => <SelectItem key={u.v} value={u.v}>{u.l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Mitarbeiter</Label>
            <Select
              value={f.assigned_to ?? NONE}
              onValueChange={(v) => set("assigned_to", v === NONE ? null : v)}
            >
              <SelectTrigger><SelectValue placeholder="Mitarbeiter wählen" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— niemand —</SelectItem>
                {team.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {[m.first_name, m.last_name].filter(Boolean).join(" ") || "(ohne Name)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={f.status ?? "aktiv"} onValueChange={(v) => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS.map((s) => <SelectItem key={s.v} value={s.v}>{s.l}</SelectItem>)}
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

export default function Wartungsvertraege() {
  const { data = [], isLoading } = useMaintenanceContracts();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<MaintenanceContract | null>(null);

  const columns: Column<MaintenanceContract>[] = [
    {
      key: "id", header: "#", width: "72px", sortable: false,
      render: (r) => {
        const idx = data.findIndex((d) => d.id === r.id);
        return <span className="text-link">{idx >= 0 ? idx + 1 : ""}</span>;
      },
    },
    {
      key: "customer", header: "Kunde", filterable: true,
      accessor: (r) => customerName(r.customer),
      render: (r) => customerName(r.customer),
    },
    { key: "name", header: "Name", filterable: true },
    {
      key: "start_date", header: "Start",
      accessor: (r) => r.start_date ?? "",
      render: (r) => fmtDate(r.start_date),
    },
    {
      key: "due_date", header: "Fällig am",
      accessor: (r) => r.due_date ?? "",
      render: (r) => fmtDate(r.due_date),
    },
    {
      key: "interval", header: "Intervall", sortable: false,
      render: (r) =>
        r.interval_value != null
          ? `${Number(r.interval_value)} ${unitLabel(r.interval_unit)}`
          : "—",
    },
    {
      key: "status", header: "Status",
      accessor: (r) => r.status ?? "",
      render: (r) => (
        <Badge variant={statusVariant(r.status)}>
          {STATUS_LABEL[r.status ?? ""] ?? r.status ?? "—"}
        </Badge>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Wartungsverträge"
        subtitle="Verwaltung für Wartungsverträge"
        actions={
          <Button onClick={() => { setEdit(null); setOpen(true); }} className="gap-1.5">
            <Plus className="h-4 w-4" /> Wartungsvertrag
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
      <ContractDialog open={open} onOpenChange={setOpen} contract={edit} />
    </div>
  );
}
