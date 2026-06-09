import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useEmployees, useUpdateEmployee, type Employee } from "@/hooks/queries/useEmployees";

const ROLE_OPTIONS = [
  { v: "geschaeftsfuehrer", l: "Geschäftsführer" },
  { v: "niederlassungsleiter", l: "Niederlassungsleiter" },
  { v: "buchhaltung", l: "Buchhaltung" },
  { v: "vertriebler", l: "Vertriebler" },
  { v: "monteur", l: "Monteur" },
] as const;

const ROLE_LABEL: Record<string, string> = Object.fromEntries(
  ROLE_OPTIONS.map((o) => [o.v, o.l]),
);

const KIND_OPTIONS = [
  { v: "standard", l: "Standard" },
  { v: "app", l: "App" },
] as const;

const KIND_LABEL: Record<string, string> = Object.fromEntries(
  KIND_OPTIONS.map((o) => [o.v, o.l]),
);

const fullName = (e: Employee) =>
  [e.first_name, e.last_name].filter(Boolean).join(" ").trim() || "—";

function EmployeeDialog({
  open, onOpenChange, employee,
}: { open: boolean; onOpenChange: (o: boolean) => void; employee: Employee | null }) {
  const update = useUpdateEmployee();
  const [f, setF] = useState<Partial<Employee>>({});

  useEffect(() => {
    if (open && employee) {
      setF({
        role: employee.role,
        position: employee.position,
        user_kind: employee.user_kind,
        is_active: employee.is_active,
      });
    }
  }, [open, employee]);

  const set = (k: keyof Employee, v: unknown) => setF((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!employee) return;
    try {
      await update.mutateAsync({
        id: employee.id,
        role: f.role,
        position: f.position,
        user_kind: f.user_kind,
        is_active: f.is_active,
      });
      toast.success("Mitarbeiter gespeichert");
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Mitarbeiter bearbeiten</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={employee ? fullName(employee) : ""} disabled />
          </div>
          <div className="space-y-1.5">
            <Label>E-Mail</Label>
            <Input value={employee?.email ?? ""} disabled />
          </div>
          <div className="space-y-1.5">
            <Label>Rolle</Label>
            <Select value={f.role ?? undefined} onValueChange={(v) => set("role", v)}>
              <SelectTrigger><SelectValue placeholder="Rolle wählen" /></SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((o) => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Position</Label>
            <Input value={f.position ?? ""} onChange={(e) => set("position", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Nutzertyp</Label>
            <Select value={f.user_kind ?? undefined} onValueChange={(v) => set("user_kind", v)}>
              <SelectTrigger><SelectValue placeholder="Nutzertyp wählen" /></SelectTrigger>
              <SelectContent>
                {KIND_OPTIONS.map((o) => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="is_active"
              checked={!!f.is_active}
              onCheckedChange={(c) => set("is_active", c === true)}
            />
            <Label htmlFor="is_active">Aktiv</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button onClick={save} disabled={update.isPending}>Speichern</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Mitarbeiter() {
  const { data = [], isLoading } = useEmployees();
  const [tab, setTab] = useState("aktiv");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Employee | null>(null);

  const rows = useMemo(
    () => data.filter((e) => (tab === "aktiv" ? e.is_active : !e.is_active)),
    [data, tab],
  );

  const columns: Column<Employee>[] = [
    {
      key: "name", header: "Name", filterable: true,
      accessor: (r) => fullName(r),
      render: (r) => <span className="text-link">{fullName(r)}</span>,
    },
    { key: "email", header: "E-Mail", filterable: true, render: (r) => r.email ?? "—" },
    {
      key: "role", header: "Rolle",
      accessor: (r) => ROLE_LABEL[r.role] ?? r.role,
      render: (r) => <Badge variant="secondary">{ROLE_LABEL[r.role] ?? r.role}</Badge>,
    },
    { key: "position", header: "Position", filterable: true, render: (r) => r.position ?? "—" },
    {
      key: "user_kind", header: "Nutzertyp",
      accessor: (r) => KIND_LABEL[r.user_kind] ?? r.user_kind,
      render: (r) => <Badge variant="outline">{KIND_LABEL[r.user_kind] ?? r.user_kind}</Badge>,
    },
  ];

  return (
    <div>
      <PageHeader title="Mitarbeiter" subtitle="Verwaltung der Mitarbeiter" />

      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="aktiv">Aktiv</TabsTrigger>
          <TabsTrigger value="inaktiv">Inaktive</TabsTrigger>
        </TabsList>
      </Tabs>

      <DataTable
        data={rows}
        columns={columns}
        loading={isLoading}
        getRowId={(r) => r.id}
        onRowClick={(r) => { setEdit(r); setOpen(true); }}
      />

      <EmployeeDialog open={open} onOpenChange={setOpen} employee={edit} />
    </div>
  );
}
