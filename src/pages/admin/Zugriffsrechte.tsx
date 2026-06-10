import { Fragment, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateCompany } from "@/hooks/queries/useCompanySettings";

// Editierbare Rollen (Geschäftsführer hat fixen Vollzugriff und ist nicht editierbar).
const ROLES = [
  { v: "niederlassungsleiter", l: "Niederlassungsleiter" },
  { v: "buchhaltung", l: "Buchhaltung" },
  { v: "vertriebler", l: "Vertriebler" },
  { v: "monteur", l: "Monteur" },
] as const;

type RoleKey = (typeof ROLES)[number]["v"];

// Auswahl-Stufen je Recht-Typ.
type OptionSet = "scope" | "yesno" | "docvis";

const OPTIONS: Record<OptionSet, { v: string; l: string }[]> = {
  // Sichtbarkeits-/Geltungsrechte
  scope: [
    { v: "eigene", l: "Eigene" },
    { v: "niederlassung", l: "Niederlassung" },
    { v: "alle", l: "Alle" },
  ],
  // Ja / Nein-Rechte
  yesno: [
    { v: "ja", l: "Ja" },
    { v: "nein", l: "Nein" },
  ],
  // Dokumente sichtbar: Ja / Ja, ohne Bearbeitung / Nein
  docvis: [
    { v: "ja", l: "Ja" },
    { v: "ja_ohne_bearbeitung", l: "Ja, ohne Bearbeitung" },
    { v: "nein", l: "Nein" },
  ],
};

// Fester Anzeigewert der Geschäftsführer-Spalte je Recht-Typ.
const GF_FIXED: Record<OptionSet, string> = {
  scope: "Alle",
  yesno: "Ja",
  docvis: "Ja",
};

interface Permission {
  v: string;
  l: string;
  opt: OptionSet;
  // Standardwert je Rolle; fehlende Rollen erben den Block-Standard.
  defaults: Partial<Record<RoleKey, string>>;
  fallback: string; // Standard für alle nicht explizit gesetzten Rollen
}

interface Block {
  title: string;
  perms: Permission[];
}

// Hilfen für kompakte Default-Definitionen.
const allScope = (monteur = "eigene"): Permission["defaults"] => ({
  niederlassungsleiter: "niederlassung",
  buchhaltung: "alle",
  vertriebler: "eigene",
  monteur,
});

const BLOCKS: Block[] = [
  {
    title: "Kontakte & Projekte",
    perms: [
      { v: "sichtbare_projekte", l: "Sichtbare Projekte", opt: "scope", defaults: allScope("eigene"), fallback: "eigene" },
      { v: "kontakte_anlegen", l: "Kontakte anlegen", opt: "yesno", defaults: { monteur: "nein" }, fallback: "ja" },
      { v: "projekte_bearbeiten", l: "Projekte bearbeiten", opt: "yesno", defaults: { monteur: "nein" }, fallback: "ja" },
      { v: "logbucheintrag_erstellen", l: "Logbucheintrag erstellen", opt: "yesno", defaults: {}, fallback: "ja" },
      { v: "dateien_hochladen", l: "Dateien hochladen", opt: "yesno", defaults: {}, fallback: "ja" },
    ],
  },
  {
    title: "Firmeneinstellungen",
    perms: [
      { v: "mitarbeiter_bearbeiten", l: "Mitarbeiter bearbeiten", opt: "yesno", defaults: { buchhaltung: "nein", vertriebler: "nein", monteur: "nein" }, fallback: "ja" },
      { v: "niederlassungen_bearbeiten", l: "Niederlassungen bearbeiten", opt: "yesno", defaults: { buchhaltung: "nein", vertriebler: "nein", monteur: "nein" }, fallback: "ja" },
      { v: "daten_exportieren", l: "Daten exportieren", opt: "yesno", defaults: { vertriebler: "nein", monteur: "nein" }, fallback: "ja" },
      { v: "zeiten_bestaetigen", l: "Zeiten bestätigen", opt: "yesno", defaults: { vertriebler: "nein", monteur: "nein" }, fallback: "ja" },
    ],
  },
  {
    title: "Module / Sidebar",
    perms: [
      { v: "modul_dokumente", l: "Dokumente", opt: "yesno", defaults: { monteur: "nein" }, fallback: "ja" },
      { v: "modul_artikelstamm", l: "Artikelstamm", opt: "yesno", defaults: { monteur: "nein" }, fallback: "ja" },
      { v: "modul_aufgaben", l: "Aufgaben", opt: "yesno", defaults: {}, fallback: "ja" },
      { v: "modul_buchhaltung", l: "Buchhaltung", opt: "yesno", defaults: { vertriebler: "nein", monteur: "nein" }, fallback: "ja" },
      { v: "modul_mitarbeiterverwaltung", l: "Mitarbeiterverwaltung", opt: "yesno", defaults: { buchhaltung: "nein", vertriebler: "nein", monteur: "nein" }, fallback: "ja" },
      { v: "modul_lager", l: "Lager", opt: "yesno", defaults: { vertriebler: "nein", monteur: "nein" }, fallback: "ja" },
      { v: "modul_statistiken", l: "Statistiken", opt: "yesno", defaults: { vertriebler: "nein", monteur: "nein" }, fallback: "ja" },
    ],
  },
  {
    title: "Planung",
    perms: [
      { v: "plantafel", l: "Plantafel", opt: "yesno", defaults: { monteur: "nein" }, fallback: "ja" },
      { v: "kalender", l: "Kalender", opt: "yesno", defaults: {}, fallback: "ja" },
      { v: "termine_bearbeiten", l: "Termine bearbeiten", opt: "yesno", defaults: { monteur: "nein" }, fallback: "ja" },
    ],
  },
  {
    title: "Dokumente sichtbar",
    perms: [
      { v: "doc_angebote", l: "Angebote", opt: "docvis", defaults: { monteur: "nein" }, fallback: "ja" },
      { v: "doc_rechnungen", l: "Rechnungen", opt: "docvis", defaults: { vertriebler: "ja_ohne_bearbeitung", monteur: "nein" }, fallback: "ja" },
      { v: "doc_auftragsbestaetigungen", l: "Auftragsbestätigungen", opt: "docvis", defaults: { monteur: "nein" }, fallback: "ja" },
      { v: "doc_mahnungen", l: "Mahnungen", opt: "docvis", defaults: { vertriebler: "nein", monteur: "nein" }, fallback: "ja" },
      { v: "doc_gutschriften", l: "Gutschriften", opt: "docvis", defaults: { vertriebler: "ja_ohne_bearbeitung", monteur: "nein" }, fallback: "ja" },
    ],
  },
];

const ALL_PERMS: Permission[] = BLOCKS.flatMap((b) => b.perms);

type Matrix = Record<string, Partial<Record<RoleKey, string>>>;

function defaultMatrix(): Matrix {
  const m: Matrix = {};
  for (const perm of ALL_PERMS) {
    m[perm.v] = {};
    for (const role of ROLES) {
      m[perm.v][role.v] = perm.defaults[role.v] ?? perm.fallback;
    }
  }
  return m;
}

// Bestehende settings.role_permissions lesen und über die Standardwerte legen.
function readMatrix(settings: unknown): Matrix {
  const s = (settings ?? {}) as Record<string, unknown>;
  const raw = (s.role_permissions ?? {}) as Record<string, unknown>;
  const base = defaultMatrix();
  for (const perm of ALL_PERMS) {
    const row = (raw[perm.v] ?? {}) as Record<string, unknown>;
    const valid = new Set(OPTIONS[perm.opt].map((o) => o.v));
    for (const role of ROLES) {
      const stored = row[role.v];
      if (typeof stored === "string" && valid.has(stored)) {
        base[perm.v][role.v] = stored;
      }
    }
  }
  return base;
}

export default function Zugriffsrechte() {
  const { company } = useAuth();
  const update = useUpdateCompany();
  const [matrix, setMatrix] = useState<Matrix>(() => readMatrix(company?.settings));

  useEffect(() => { setMatrix(readMatrix(company?.settings)); }, [company?.settings]);

  const optByPerm = useMemo(() => {
    const map: Record<string, OptionSet> = {};
    for (const perm of ALL_PERMS) map[perm.v] = perm.opt;
    return map;
  }, []);

  const setCell = (perm: string, role: RoleKey, value: string) =>
    setMatrix((m) => ({ ...m, [perm]: { ...m[perm], [role]: value } }));

  const reset = () => setMatrix(defaultMatrix());

  const save = async () => {
    try {
      const base = (company?.settings ?? {}) as Record<string, unknown>;
      await update.mutateAsync({ settings: { ...base, role_permissions: matrix } });
      toast.success("Zugriffsrechte gespeichert");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const colCount = 2 + ROLES.length; // Recht + Geschäftsführer + editierbare Rollen

  return (
    <div>
      <PageHeader
        title="Zugriffsrechte"
        subtitle="Verwaltung der Benutzergruppen-Rechte"
        actions={
          <>
            <Button variant="outline" onClick={reset} disabled={update.isPending}>
              Zurücksetzen
            </Button>
            <Button onClick={save} disabled={update.isPending}>Speichern</Button>
          </>
        }
      />
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Recht</th>
              <th className="px-4 py-3 font-medium">Geschäftsführer</th>
              {ROLES.map((r) => (
                <th key={r.v} className="px-4 py-3 font-medium">{r.l}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BLOCKS.map((block) => (
              <Fragment key={block.title}>
                <tr className="border-t bg-muted/30">
                  <td
                    colSpan={colCount}
                    className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {block.title}
                  </td>
                </tr>
                {block.perms.map((perm) => {
                  const opts = OPTIONS[optByPerm[perm.v]];
                  return (
                    <tr key={perm.v} className="border-t">
                      <td className="px-4 py-3">{perm.l}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {GF_FIXED[perm.opt]}
                      </td>
                      {ROLES.map((role) => (
                        <td key={role.v} className="px-4 py-2">
                          <Select
                            value={matrix[perm.v]?.[role.v] ?? perm.fallback}
                            onValueChange={(v) => setCell(perm.v, role.v, v)}
                          >
                            <SelectTrigger className="h-8 w-[180px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {opts.map((o) => (
                                <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </Fragment>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
