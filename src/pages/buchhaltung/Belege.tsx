import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { fmtEUR, fmtDate, toISODate } from "@/lib/format";
import { useReceipts, useUpsertReceipt, type Receipt } from "@/hooks/queries/useReceipts";
import { useContacts, type Contact } from "@/hooks/queries/useContacts";
import { Plus } from "lucide-react";

const TYPE_TABS = [
  { v: "alle", l: "Alle" },
  { v: "einnahme", l: "Einnahmen" },
  { v: "ausgabe", l: "Ausgaben" },
];

const TYPE_LABEL: Record<string, string> = {
  einnahme: "Einnahme",
  ausgabe: "Ausgabe",
};

const STATUS_OPTIONS = [
  { v: "entwurf", l: "Entwurf" },
  { v: "offen", l: "Offen" },
  { v: "faellig", l: "Fällig" },
  { v: "teilbezahlt", l: "Teilbezahlt" },
  { v: "bezahlt", l: "Bezahlt" },
];

const STATUS_LABEL: Record<string, string> = Object.fromEntries(
  STATUS_OPTIONS.map((s) => [s.v, s.l]),
);

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  entwurf: "outline",
  offen: "secondary",
  faellig: "destructive",
  teilbezahlt: "secondary",
  bezahlt: "default",
};

function contactLabel(c: Contact): string {
  if (c.company_name) return c.company_name;
  const name = [c.first_name, c.last_name].filter(Boolean).join(" ");
  return name || "—";
}

function ReceiptDialog({
  open, onOpenChange, contacts,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  contacts: Contact[];
}) {
  const upsert = useUpsertReceipt();
  const [f, setF] = useState<Partial<Receipt>>({});
  useEffect(() => {
    if (open) {
      setF({
        type: "ausgabe",
        status: "offen",
        doc_date: toISODate(),
        net_amount: 0,
        gross_amount: 0,
      });
    }
  }, [open]);

  const set = (k: keyof Receipt, v: unknown) => setF((p) => ({ ...p, [k]: v }));
  const num = (v: string) => (v === "" ? 0 : Number(v.replace(",", ".")));

  const save = async () => {
    if (!f.type) return toast.error("Bitte einen Typ wählen.");
    try {
      await upsert.mutateAsync(f);
      toast.success("Beleg gespeichert");
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Beleg erfassen</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 pt-1">
          <div className="space-y-1.5">
            <Label>Typ</Label>
            <Select value={f.type ?? "ausgabe"} onValueChange={(v) => set("type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="einnahme">Einnahme</SelectItem>
                <SelectItem value="ausgabe">Ausgabe</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{f.type === "einnahme" ? "Kunde" : "Lieferant"}</Label>
            <Select
              value={f.contact_id ?? ""}
              onValueChange={(v) => set("contact_id", v)}
            >
              <SelectTrigger><SelectValue placeholder="Auswählen…" /></SelectTrigger>
              <SelectContent>
                {contacts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{contactLabel(c)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Belegnummer</Label>
            <Input value={f.receipt_number ?? ""} onChange={(e) => set("receipt_number", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Kategorie</Label>
            <Input value={f.category ?? ""} onChange={(e) => set("category", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Nettobetrag (€)</Label>
            <Input value={String(f.net_amount ?? 0)} onChange={(e) => set("net_amount", num(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label>Bruttobetrag (€)</Label>
            <Input value={String(f.gross_amount ?? 0)} onChange={(e) => set("gross_amount", num(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label>Belegdatum</Label>
            <Input type="date" value={f.doc_date ?? ""} onChange={(e) => set("doc_date", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Fälligkeitsdatum</Label>
            <Input type="date" value={f.due_date ?? ""} onChange={(e) => set("due_date", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={f.status ?? "offen"} onValueChange={(v) => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.v} value={s.v}>{s.l}</SelectItem>
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

export default function Belege() {
  const { data = [], isLoading } = useReceipts();
  const { data: contacts = [] } = useContacts();
  const [tab, setTab] = useState("alle");
  const [open, setOpen] = useState(false);

  const rows = useMemo(() => {
    if (tab === "alle") return data;
    return data.filter((r) => r.type === tab);
  }, [data, tab]);

  const columns: Column<Receipt>[] = [
    {
      key: "type", header: "Typ",
      render: (r) => <Badge variant="secondary">{TYPE_LABEL[r.type] ?? r.type}</Badge>,
    },
    {
      key: "receipt_number", header: "Belegnummer", filterable: true,
      render: (r) => <span className="text-link">{r.receipt_number ?? "—"}</span>,
    },
    { key: "category", header: "Kategorie", filterable: true,
      render: (r) => r.category ?? "—" },
    {
      key: "net_amount", header: "Nettobetrag", className: "text-right",
      render: (r) => fmtEUR(Number(r.net_amount)),
    },
    {
      key: "open_amount", header: "Offener Betrag", className: "text-right",
      render: (r) => fmtEUR(Number(r.open_amount)),
    },
    {
      key: "doc_date", header: "Datum",
      render: (r) => fmtDate(r.doc_date),
    },
    {
      key: "status", header: "Status",
      render: (r) => (
        <Badge variant={STATUS_VARIANT[r.status ?? ""] ?? "secondary"}>
          {STATUS_LABEL[r.status ?? ""] ?? r.status ?? "—"}
        </Badge>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Buchhaltung — Belege"
        subtitle="Einnahmen und Ausgaben"
        actions={
          <Button onClick={() => setOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Beleg erfassen
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList>
          {TYPE_TABS.map((t) => <TabsTrigger key={t.v} value={t.v}>{t.l}</TabsTrigger>)}
        </TabsList>
      </Tabs>

      <DataTable
        data={rows}
        columns={columns}
        loading={isLoading}
        getRowId={(r) => r.id}
      />

      <ReceiptDialog open={open} onOpenChange={setOpen} contacts={contacts} />
    </div>
  );
}
