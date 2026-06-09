import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { fmtDateTime } from "@/lib/format";
import { useOrders, useUpsertOrder, type Order } from "@/hooks/queries/useOrders";
import { useContacts } from "@/hooks/queries/useContacts";
import { useTaskProfiles } from "@/hooks/queries/useTasks";
import { Plus } from "lucide-react";

const NONE = "__none__";

const TYPES = [
  { v: "wartung", l: "Wartung" },
  { v: "reparatur", l: "Reparatur" },
  { v: "notdienst", l: "Notdienst" },
  { v: "reklamation", l: "Reklamation" },
  { v: "sonstiges", l: "Sonstiges" },
];

const STATUSES = [
  { v: "offen", l: "Offen" },
  { v: "zugewiesen", l: "Zugewiesen" },
  { v: "erledigt", l: "Erledigt" },
  { v: "rechnung", l: "Rechnung" },
  { v: "abgeschlossen", l: "Abgeschlossen" },
  { v: "archiviert", l: "Archiviert" },
];

const TYPE_LABEL: Record<string, string> = Object.fromEntries(TYPES.map((t) => [t.v, t.l]));
const STATUS_LABEL: Record<string, string> = Object.fromEntries(STATUSES.map((s) => [s.v, s.l]));

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  offen: "secondary",
  zugewiesen: "default",
  erledigt: "default",
  rechnung: "outline",
  abgeschlossen: "outline",
  archiviert: "secondary",
};

const TABS = [
  { v: "offen", l: "Offen" },
  { v: "alle", l: "Alle" },
  { v: "zugewiesen", l: "Zugewiesen" },
  { v: "erledigt", l: "Erledigt" },
  { v: "rechnung", l: "Rechnung" },
  { v: "abgeschlossen", l: "Abgeschlossen" },
  { v: "archiviert", l: "Archiviert" },
];

const contactName = (c: { company_name: string | null; first_name: string | null; last_name: string | null }) =>
  c.company_name || [c.first_name, c.last_name].filter(Boolean).join(" ") || "Ohne Namen";

const profileName = (p: { first_name: string | null; last_name: string | null; email: string | null }) =>
  [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email || "Ohne Namen";

function OrderDialog({ open, onOpenChange, order }: { open: boolean; onOpenChange: (o: boolean) => void; order?: Order | null }) {
  const upsert = useUpsertOrder();
  const { data: contacts = [] } = useContacts();
  const { data: profiles = [] } = useTaskProfiles();
  const [f, setF] = useState<Partial<Order>>({});

  useEffect(() => {
    if (open) setF(order ?? { type: "wartung", status: "offen" });
  }, [open, order]);

  const set = (k: keyof Order, v: unknown) => setF((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!f.title) return toast.error("Bitte einen Titel angeben.");
    try {
      await upsert.mutateAsync(f);
      toast.success(order ? "Auftrag aktualisiert" : "Auftrag angelegt");
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{order ? "Auftrag bearbeiten" : "Neuer Auftrag"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="space-y-1.5 col-span-2">
            <Label>Titel</Label>
            <Input value={f.title ?? ""} onChange={(e) => set("title", e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Kunde</Label>
            <Select
              value={f.customer_id ?? NONE}
              onValueChange={(v) => set("customer_id", v === NONE ? null : v)}
            >
              <SelectTrigger><SelectValue placeholder="Kunde wählen" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Kein Kunde</SelectItem>
                {contacts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{contactName(c)}</SelectItem>
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
              <SelectTrigger><SelectValue placeholder="Mitarbeiter wählen" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Niemand</SelectItem>
                {profiles.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{profileName(p)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Typ</Label>
            <Select value={f.type ?? "wartung"} onValueChange={(v) => set("type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={f.status ?? "offen"} onValueChange={(v) => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => <SelectItem key={s.v} value={s.v}>{s.l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Start</Label>
            <Input
              type="datetime-local"
              value={f.start_at ? f.start_at.slice(0, 16) : ""}
              onChange={(e) => set("start_at", e.target.value ? new Date(e.target.value).toISOString() : null)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Ende</Label>
            <Input
              type="datetime-local"
              value={f.end_at ? f.end_at.slice(0, 16) : ""}
              onChange={(e) => set("end_at", e.target.value ? new Date(e.target.value).toISOString() : null)}
            />
          </div>

          <div className="space-y-1.5 col-span-2">
            <Label>Adresse</Label>
            <Input value={f.address ?? ""} onChange={(e) => set("address", e.target.value)} />
          </div>

          <div className="space-y-1.5 col-span-2">
            <Label>Beschreibung</Label>
            <Textarea rows={3} value={f.description ?? ""} onChange={(e) => set("description", e.target.value)} />
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

export default function Auftraege() {
  const { data = [], isLoading } = useOrders();
  const { data: contacts = [] } = useContacts();
  const { data: profiles = [] } = useTaskProfiles();
  const [tab, setTab] = useState("offen");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Order | null>(null);

  const contactById = useMemo(() => new Map(contacts.map((c) => [c.id, c])), [contacts]);
  const profileById = useMemo(() => new Map(profiles.map((p) => [p.id, p])), [profiles]);

  const rows = useMemo(() => {
    if (tab === "alle") return data;
    return data.filter((o) => o.status === tab);
  }, [data, tab]);

  const columns: Column<Order>[] = [
    {
      key: "order_number", header: "Auftragsnummer", filterable: true,
      render: (r) => <span className="text-link">{r.order_number ?? "—"}</span>,
    },
    {
      key: "type", header: "Typ", filterable: true,
      render: (r) => (r.type ? (TYPE_LABEL[r.type] ?? r.type) : "—"),
    },
    { key: "title", header: "Titel", filterable: true },
    {
      key: "status", header: "Status",
      render: (r) => (
        <Badge variant={r.status ? (STATUS_VARIANT[r.status] ?? "secondary") : "secondary"}>
          {r.status ? (STATUS_LABEL[r.status] ?? r.status) : "—"}
        </Badge>
      ),
    },
    {
      key: "assigned_to", header: "Mitarbeiter",
      accessor: (r) => (r.assigned_to ? profileName(profileById.get(r.assigned_to) ?? { first_name: null, last_name: null, email: null }) : ""),
      render: (r) => {
        const p = r.assigned_to ? profileById.get(r.assigned_to) : undefined;
        return p ? profileName(p) : "—";
      },
    },
    {
      key: "customer_id", header: "Kunde",
      accessor: (r) => (r.customer_id ? contactName(contactById.get(r.customer_id) ?? { company_name: null, first_name: null, last_name: null }) : ""),
      render: (r) => {
        const c = r.customer_id ? contactById.get(r.customer_id) : undefined;
        return c ? contactName(c) : "—";
      },
    },
    {
      key: "start_at", header: "Termin",
      render: (r) => (r.start_at ? fmtDateTime(r.start_at) : "—"),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Aufträge"
        subtitle="Field Service"
        actions={
          <Button onClick={() => { setEdit(null); setOpen(true); }} className="gap-1.5">
            <Plus className="h-4 w-4" /> Auftrag
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList>
          {TABS.map((t) => <TabsTrigger key={t.v} value={t.v}>{t.l}</TabsTrigger>)}
        </TabsList>
      </Tabs>

      <DataTable
        data={rows}
        columns={columns}
        loading={isLoading}
        getRowId={(r) => r.id}
        onRowClick={(r) => { setEdit(r); setOpen(true); }}
      />

      <OrderDialog open={open} onOpenChange={setOpen} order={edit} />
    </div>
  );
}
