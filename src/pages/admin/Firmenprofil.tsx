import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateCompany, useUploadLogo } from "@/hooks/queries/useCompanySettings";
import { Upload, Loader2 } from "lucide-react";
import type { TablesUpdate } from "@/integrations/supabase/helpers";

const FIELDS: { k: keyof TablesUpdate<"companies">; l: string }[] = [
  { k: "name", l: "Firmenname" }, { k: "legal_form", l: "Rechtsform" },
  { k: "address_street", l: "Straße" }, { k: "address_zip", l: "PLZ" }, { k: "address_city", l: "Ort" },
  { k: "phone", l: "Telefon" }, { k: "mobile", l: "Mobil" }, { k: "fax", l: "Fax" },
  { k: "account_holder", l: "Kontoinhaber" }, { k: "bank", l: "Bank" },
  { k: "iban", l: "IBAN" }, { k: "bic", l: "BIC" },
  { k: "tax_number", l: "Steuernummer" }, { k: "vat_id", l: "USt-IdNr." },
  { k: "commercial_register", l: "Handelsregisternummer" }, { k: "founding_year", l: "Gründung" },
];

export default function Firmenprofil() {
  const { company } = useAuth();
  const update = useUpdateCompany();
  const uploadLogo = useUploadLogo();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<TablesUpdate<"companies">>({});

  useEffect(() => { if (company) setForm(company); }, [company]);
  const set = (k: keyof TablesUpdate<"companies">, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    try { await update.mutateAsync(form); toast.success("Firmendaten gespeichert"); }
    catch (e) { toast.error((e as Error).message); }
  };

  const onLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try { await uploadLogo.mutateAsync(file); toast.success("Logo aktualisiert"); }
    catch (err) { toast.error((err as Error).message); }
  };

  return (
    <div>
      <PageHeader title="Firmenprofil" subtitle="Stammdaten, Logo & Bankverbindung"
        actions={<Button onClick={save} disabled={update.isPending}>Speichern</Button>} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="space-y-4 p-5">
          <h3 className="font-medium">Logo</h3>
          <div className="flex h-32 items-center justify-center rounded-md border border-dashed bg-muted/30">
            {company?.logo_url ? <img src={company.logo_url} alt="Logo" className="max-h-28 max-w-full object-contain" /> : <span className="text-sm text-muted-foreground">Noch kein Logo</span>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onLogo} />
          <Button variant="secondary" className="w-full gap-1.5" onClick={() => fileRef.current?.click()} disabled={uploadLogo.isPending}>
            {uploadLogo.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Logo hochladen
          </Button>
          <p className="text-xs text-muted-foreground">Das Logo erscheint in der Seitenleiste und auf allen PDF-Dokumenten.</p>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-4 font-medium">Firmendaten</h3>
          <div className="grid grid-cols-2 gap-4">
            {FIELDS.map((f) => (
              <div key={String(f.k)} className="space-y-1.5">
                <Label>{f.l}</Label>
                <Input value={(form[f.k] as string) ?? ""} onChange={(e) => set(f.k, e.target.value)} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
