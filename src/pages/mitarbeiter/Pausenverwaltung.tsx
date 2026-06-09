import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateCompany } from "@/hooks/queries/useCompanySettings";

type BreakRule = "gesetzlich" | "fest" | "keine";

const OPTIONS: { v: BreakRule; l: string; d: string }[] = [
  { v: "gesetzlich", l: "Gesetzliche Vorgaben", d: "Pausen werden anhand der gesetzlichen Vorschriften automatisch berechnet." },
  { v: "fest", l: "Feste Zeiten", d: "Es gelten unternehmensweit festgelegte feste Pausenzeiten." },
  { v: "keine", l: "Keine Pausenregel", d: "Es wird keine automatische Pausenregel angewendet." },
];

export default function Pausenverwaltung() {
  const { company } = useAuth();
  const update = useUpdateCompany();
  const [rule, setRule] = useState<BreakRule>("gesetzlich");

  useEffect(() => {
    const settings = (company?.settings ?? {}) as Record<string, unknown>;
    const current = settings.break_rule;
    if (current === "gesetzlich" || current === "fest" || current === "keine") {
      setRule(current);
    }
  }, [company?.settings]);

  const save = async () => {
    const settings = (company?.settings ?? {}) as Record<string, unknown>;
    try {
      await update.mutateAsync({ settings: { ...settings, break_rule: rule } });
      toast.success("Pausenregel gespeichert");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div>
      <PageHeader
        title="Pausenverwaltung"
        subtitle="Festlegung der Pausenregelung für die Zeiterfassung"
        actions={
          <Button onClick={save} disabled={update.isPending}>Speichern</Button>
        }
      />

      <Card className="max-w-2xl p-6">
        <RadioGroup value={rule} onValueChange={(v) => setRule(v as BreakRule)} className="gap-4">
          {OPTIONS.map((o) => (
            <label
              key={o.v}
              htmlFor={`break-${o.v}`}
              className="flex cursor-pointer items-start gap-3 rounded-md border p-4 hover:bg-accent/40"
            >
              <RadioGroupItem id={`break-${o.v}`} value={o.v} className="mt-1" />
              <div>
                <Label htmlFor={`break-${o.v}`} className="cursor-pointer font-medium">{o.l}</Label>
                <p className="mt-0.5 text-sm text-muted-foreground">{o.d}</p>
              </div>
            </label>
          ))}
        </RadioGroup>
      </Card>
    </div>
  );
}
