import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateCompany } from "@/hooks/queries/useCompanySettings";

const ROLES = [
  { v: "geschaeftsfuehrer", l: "Geschäftsführer" },
  { v: "niederlassungsleiter", l: "Niederlassungsleiter" },
  { v: "buchhaltung", l: "Buchhaltung" },
  { v: "vertriebler", l: "Vertriebler" },
  { v: "monteur", l: "Monteur" },
];

const PERMISSIONS = [
  { v: "kontakte", l: "Kontakte verwalten" },
  { v: "projekte", l: "Projekte verwalten" },
  { v: "dokumente", l: "Dokumente erstellen" },
  { v: "buchhaltung", l: "Buchhaltung einsehen" },
  { v: "lager", l: "Lager verwalten" },
  { v: "einstellungen", l: "Einstellungen ändern" },
];

type Matrix = Record<string, Record<string, boolean>>;

function readMatrix(settings: unknown): Matrix {
  const s = (settings ?? {}) as Record<string, unknown>;
  const raw = (s.role_permissions ?? {}) as Record<string, unknown>;
  const m: Matrix = {};
  for (const perm of PERMISSIONS) {
    const row = (raw[perm.v] ?? {}) as Record<string, unknown>;
    m[perm.v] = {};
    for (const role of ROLES) {
      m[perm.v][role.v] = Boolean(row[role.v]);
    }
  }
  return m;
}

export default function Zugriffsrechte() {
  const { company } = useAuth();
  const update = useUpdateCompany();
  const [matrix, setMatrix] = useState<Matrix>(() => readMatrix(company?.settings));

  useEffect(() => { setMatrix(readMatrix(company?.settings)); }, [company?.settings]);

  const setCell = (perm: string, role: string, value: boolean) =>
    setMatrix((m) => ({ ...m, [perm]: { ...m[perm], [role]: value } }));

  const save = async () => {
    try {
      const base = (company?.settings ?? {}) as Record<string, unknown>;
      await update.mutateAsync({ settings: { ...base, role_permissions: matrix } });
      toast.success("Zugriffsrechte gespeichert");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div>
      <PageHeader
        title="Zugriffsrechte"
        subtitle="Berechtigungen je Rolle"
        actions={<Button onClick={save} disabled={update.isPending}>Speichern</Button>}
      />
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Recht</th>
              {ROLES.map((r) => (
                <th key={r.v} className="px-4 py-3 font-medium">{r.l}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSIONS.map((perm) => (
              <tr key={perm.v} className="border-t">
                <td className="px-4 py-3">{perm.l}</td>
                {ROLES.map((role) => (
                  <td key={role.v} className="px-4 py-2">
                    <Select
                      value={matrix[perm.v]?.[role.v] ? "ja" : "nein"}
                      onValueChange={(v) => setCell(perm.v, role.v, v === "ja")}
                    >
                      <SelectTrigger className="h-8 w-[88px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ja">Ja</SelectItem>
                        <SelectItem value="nein">Nein</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
