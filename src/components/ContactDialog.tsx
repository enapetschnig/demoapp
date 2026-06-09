import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useUpsertContact, type Contact } from "@/hooks/queries/useContacts";

const CATEGORIES = [
  { v: "kunde", l: "Kunde" },
  { v: "lieferant", l: "Lieferant" },
  { v: "partner", l: "Partner" },
  { v: "ansprechpartner", l: "Ansprechpartner" },
];

export function ContactDialog({
  open, onOpenChange, contact,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  contact?: Contact | null;
}) {
  const upsert = useUpsertContact();
  const [form, setForm] = useState<Partial<Contact>>({ type: "person", category: "kunde" });

  useEffect(() => {
    if (open) setForm(contact ?? { type: "person", category: "kunde", country: "Österreich" });
  }, [open, contact]);

  const set = (k: keyof Contact, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.first_name && !form.last_name && !form.company_name) {
      return toast.error("Bitte Name oder Firmenname angeben.");
    }
    try {
      await upsert.mutateAsync(form);
      toast.success(contact ? "Kontakt aktualisiert" : "Kontakt angelegt");
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{contact ? "Kontakt bearbeiten" : "Neuer Kontakt"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="space-y-1.5">
            <Label>Typ</Label>
            <Select value={form.type ?? "person"} onValueChange={(v) => set("type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="person">Person</SelectItem>
                <SelectItem value="firma">Firma</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Kategorie</Label>
            <Select value={form.category ?? "kunde"} onValueChange={(v) => set("category", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c.v} value={c.v}>{c.l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Kundennummer</Label>
            <Input value={form.customer_number ?? ""} onChange={(e) => set("customer_number", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Firmenname</Label>
            <Input value={form.company_name ?? ""} onChange={(e) => set("company_name", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Anrede</Label>
            <Input value={form.salutation ?? ""} onChange={(e) => set("salutation", e.target.value)} placeholder="Herr / Frau" />
          </div>
          <div />
          <div className="space-y-1.5">
            <Label>Vorname</Label>
            <Input value={form.first_name ?? ""} onChange={(e) => set("first_name", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Nachname</Label>
            <Input value={form.last_name ?? ""} onChange={(e) => set("last_name", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>E-Mail</Label>
            <Input type="email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Telefon</Label>
            <Input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Mobil</Label>
            <Input value={form.mobile ?? ""} onChange={(e) => set("mobile", e.target.value)} />
          </div>
          <div />
          <div className="space-y-1.5 col-span-2">
            <Label>Straße</Label>
            <Input value={form.address_street ?? ""} onChange={(e) => set("address_street", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>PLZ</Label>
            <Input value={form.address_zip ?? ""} onChange={(e) => set("address_zip", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Ort</Label>
            <Input value={form.address_city ?? ""} onChange={(e) => set("address_city", e.target.value)} />
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label>Notizen</Label>
            <Textarea value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} rows={2} />
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
