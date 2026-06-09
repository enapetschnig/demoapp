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
import { fmtEUR, fmtDate, toISODate } from "@/lib/format";
import {
  useInvoiceDocuments, useAddPayment, type InvoiceDocument,
} from "@/hooks/queries/usePayments";
import { Wallet } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  offen: "Offen",
  teilzahlung: "Teilzahlung",
  bezahlt: "Bezahlt",
  ueberfaellig: "Überfällig",
  storniert: "Storniert",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  offen: "secondary",
  teilzahlung: "outline",
  bezahlt: "default",
  ueberfaellig: "destructive",
  storniert: "secondary",
};

const METHODS = [
  { v: "ueberweisung", l: "Überweisung" },
  { v: "bar", l: "Bar" },
  { v: "karte", l: "Karte" },
  { v: "lastschrift", l: "Lastschrift" },
  { v: "sonstige", l: "Sonstige" },
];

function customerName(doc: InvoiceDocument): string {
  const c = doc.customer;
  if (!c) return "—";
  if (c.company_name) return c.company_name;
  const name = [c.first_name, c.last_name].filter(Boolean).join(" ");
  return name || c.customer_number || "—";
}

function PaymentDialog({
  open, onOpenChange, doc,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  doc: InvoiceDocument | null;
}) {
  const addPayment = useAddPayment();
  const [amount, setAmount] = useState("0");
  const [paidAt, setPaidAt] = useState(toISODate());
  const [method, setMethod] = useState("ueberweisung");
  const [note, setNote] = useState("");

  const num = (v: string) => (v === "" ? 0 : Number(v.replace(",", ".")));

  useEffect(() => {
    if (open && doc) {
      setAmount(String(Number(doc.open_amount ?? 0)));
      setPaidAt(toISODate());
      setMethod("ueberweisung");
      setNote("");
    }
  }, [open, doc]);

  const save = async () => {
    if (!doc) return;
    const amt = num(amount);
    if (!amt || amt <= 0) return toast.error("Bitte einen gültigen Betrag angeben.");
    if (!paidAt) return toast.error("Bitte ein Zahlungsdatum angeben.");
    try {
      await addPayment.mutateAsync({
        document_id: doc.id,
        amount: amt,
        paid_at: paidAt,
        method,
        note: note || null,
      });
      toast.success("Zahlung erfasst");
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Zahlung erfassen{doc?.number ? ` — ${doc.number}` : ""}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 pt-1">
          <div className="col-span-2 space-y-1.5">
            <Label>Offener Bruttobetrag</Label>
            <div className="text-sm font-medium">{fmtEUR(Number(doc?.open_amount ?? 0))}</div>
          </div>
          <div className="space-y-1.5">
            <Label>Betrag (€)</Label>
            <Input value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Zahlungsdatum</Label>
            <Input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Zahlungsart</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {METHODS.map((m) => <SelectItem key={m.v} value={m.v}>{m.l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Notiz</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button onClick={save} disabled={addPayment.isPending}>Speichern</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Rechnungen() {
  const { data = [], isLoading } = useInvoiceDocuments();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<InvoiceDocument | null>(null);

  const openPayment = (doc: InvoiceDocument) => {
    setActive(doc);
    setOpen(true);
  };

  const columns: Column<InvoiceDocument>[] = [
    {
      key: "number", header: "Rechnungsnr.", filterable: true,
      render: (r) => <span className="text-link">{r.number ?? "—"}</span>,
    },
    {
      key: "customer", header: "Kunde", filterable: true,
      accessor: (r) => customerName(r),
      render: (r) => customerName(r),
    },
    {
      key: "payment_status", header: "Zahlungsstatus",
      render: (r) => (
        <Badge variant={STATUS_VARIANT[r.payment_status] ?? "secondary"}>
          {STATUS_LABEL[r.payment_status] ?? r.payment_status}
        </Badge>
      ),
    },
    {
      key: "doc_date", header: "Datum",
      accessor: (r) => r.doc_date,
      render: (r) => fmtDate(r.doc_date),
    },
    {
      key: "due_date", header: "Fällig am",
      accessor: (r) => r.due_date,
      render: (r) => (r.due_date ? fmtDate(r.due_date) : "—"),
    },
    {
      key: "gross_amount", header: "Bruttobetrag", className: "text-right",
      accessor: (r) => Number(r.gross_amount),
      render: (r) => fmtEUR(Number(r.gross_amount)),
    },
    {
      key: "open_amount", header: "Offener Bruttobetrag", className: "text-right",
      accessor: (r) => Number(r.open_amount),
      render: (r) => fmtEUR(Number(r.open_amount)),
    },
    {
      key: "actions", header: "", sortable: false, className: "text-right",
      render: (r) => (
        <Button
          size="sm"
          variant="secondary"
          className="gap-1.5"
          onClick={(e) => { e.stopPropagation(); openPayment(r); }}
        >
          <Wallet className="h-4 w-4" /> Zahlung erfassen
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Buchhaltung — Rechnungen"
        subtitle="Offene Posten & Zahlungseingänge"
      />
      <DataTable
        data={data}
        columns={columns}
        loading={isLoading}
        getRowId={(r) => r.id}
        onRowClick={(r) => openPayment(r)}
      />
      <PaymentDialog open={open} onOpenChange={setOpen} doc={active} />
    </div>
  );
}
