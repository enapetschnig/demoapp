import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateCompany } from "@/hooks/queries/useCompanySettings";
import { applyPrimaryColor, DEFAULT_PRIMARY } from "@/lib/theme";

export default function Seitendarstellung() {
  const { company } = useAuth();
  const update = useUpdateCompany();
  const [color, setColor] = useState(DEFAULT_PRIMARY);

  useEffect(() => { if (company?.primary_color) setColor(company.primary_color); }, [company]);

  // Live-Vorschau
  useEffect(() => { applyPrimaryColor(color); }, [color]);

  const save = async () => {
    try { await update.mutateAsync({ primary_color: color }); toast.success("Farbe gespeichert"); }
    catch (e) { toast.error((e as Error).message); }
  };
  const reset = () => { setColor(DEFAULT_PRIMARY); };

  return (
    <div>
      <PageHeader title="Seitendarstellung" subtitle="Farbgestaltung der Anwendung" />
      <Card className="max-w-xl space-y-5 p-6">
        <div>
          <Label className="mb-2 block">Vorschau</Label>
          <div className="flex h-16 items-center gap-3 rounded-md p-3" style={{ background: `linear-gradient(90deg, ${color}22, ${color})` }}>
            <span className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground">Aa Aktion</span>
            <span className="text-link">Beispiel-Link</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Eine passende Textfarbe wird beim Speichern automatisch berechnet.</p>
        </div>

        <div className="space-y-1.5">
          <Label>Primärfarbe wählen</Label>
          <div className="flex items-center gap-3">
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-14 cursor-pointer rounded border" />
            <Input value={color} onChange={(e) => setColor(e.target.value)} className="w-40 font-mono" />
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" onClick={reset}>Zurücksetzen</Button>
          <Button onClick={save} disabled={update.isPending}>Speichern</Button>
        </div>
      </Card>
    </div>
  );
}
