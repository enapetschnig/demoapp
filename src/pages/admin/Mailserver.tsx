import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateCompany } from "@/hooks/queries/useCompanySettings";
import { Info } from "lucide-react";

const PROVIDERS = [
  { v: "custom", l: "Eigener SMTP-Server" },
  { v: "gmail", l: "Gmail" },
  { v: "outlook", l: "Outlook / Microsoft 365" },
  { v: "gmx", l: "GMX" },
  { v: "web_de", l: "Web.de" },
];

interface MailserverConfig {
  email: string;
  provider: string;
  smtp_user: string;
  smtp_password: string;
  bcc: string;
}

function readMailserver(settings: unknown): MailserverConfig {
  const s = (settings ?? {}) as Record<string, unknown>;
  const raw = (s.mailserver ?? {}) as Record<string, unknown>;
  return {
    email: String(raw.email ?? ""),
    provider: String(raw.provider ?? "custom"),
    smtp_user: String(raw.smtp_user ?? ""),
    smtp_password: String(raw.smtp_password ?? ""),
    bcc: String(raw.bcc ?? ""),
  };
}

export default function Mailserver() {
  const { company } = useAuth();
  const update = useUpdateCompany();
  const [f, setF] = useState<MailserverConfig>(() => readMailserver(company?.settings));

  useEffect(() => { setF(readMailserver(company?.settings)); }, [company?.settings]);
  const set = (k: keyof MailserverConfig, v: string) => setF((p) => ({ ...p, [k]: v }));

  const save = async () => {
    try {
      const base = (company?.settings ?? {}) as Record<string, unknown>;
      await update.mutateAsync({ settings: { ...base, mailserver: { ...f } } });
      toast.success("Mailserver-Einstellungen gespeichert");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div>
      <PageHeader
        title="Mailserver"
        subtitle="SMTP-Konfiguration für den E-Mail-Versand"
        actions={<Button onClick={save} disabled={update.isPending}>Speichern</Button>}
      />
      <Alert className="mb-4">
        <Info className="h-4 w-4" />
        <AlertDescription>
          Der automatische E-Mail-Versand ist noch nicht aktiv. Die Einstellungen werden
          gespeichert und sobald der Versand freigeschaltet ist verwendet.
        </AlertDescription>
      </Alert>
      <Card className="p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>E-Mail-Adresse</Label>
            <Input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Anbieter</Label>
            <Select value={f.provider} onValueChange={(v) => set("provider", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PROVIDERS.map((p) => <SelectItem key={p.v} value={p.v}>{p.l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>SMTP-Benutzername</Label>
            <Input value={f.smtp_user} onChange={(e) => set("smtp_user", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>SMTP-Kennwort</Label>
            <Input type="password" value={f.smtp_password} onChange={(e) => set("smtp_password", e.target.value)} />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>BCC (Kopie an)</Label>
            <Input type="email" value={f.bcc} onChange={(e) => set("bcc", e.target.value)} />
          </div>
        </div>
      </Card>
    </div>
  );
}
