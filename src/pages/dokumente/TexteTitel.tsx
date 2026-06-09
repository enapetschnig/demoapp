import { useEffect, useMemo, useState } from "react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { toast } from "sonner";
import { fmtDate } from "@/lib/format";
import {
  useDocumentTexts, useUpsertDocumentText, type DocumentText,
} from "@/hooks/queries/useDocConfig";
import { Plus } from "lucide-react";

const BASE_TYPES = [
  { v: "angebot", l: "Angebot" },
  { v: "auftrag", l: "Auftrag" },
  { v: "lieferschein", l: "Lieferschein" },
  { v: "rechnung", l: "Rechnung" },
  { v: "gutschrift", l: "Gutschrift" },
  { v: "mahnung", l: "Mahnung" },
];

const SOURCE_LABEL: Record<string, string> = {
  system: "System",
  eigene: "Eigene",
};

// HTML → gekürzter Klartext für Vorschau in der Tabelle.
function htmlToPreview(html: string | null | undefined, max = 80): string {
  if (!html) return "";
  const text = html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function TextDialog({
  open, onOpenChange, kind, text,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  kind: "text" | "titel";
  text?: DocumentText | null;
}) {
  const upsert = useUpsertDocumentText();
  const [f, setF] = useState<Partial<DocumentText>>({});

  useEffect(() => {
    if (open) {
      setF(text ?? { kind, source: "eigene", title: "", content: "", placement: "einleitung" });
    }
  }, [open, text, kind]);

  const set = (k: keyof DocumentText, v: unknown) => setF((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!f.title) return toast.error("Bitte einen Titel angeben.");
    try {
      await upsert.mutateAsync({ ...f, kind });
      toast.success("Gespeichert");
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const label = kind === "titel" ? "Titel" : "Text";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{text ? `${label} bearbeiten` : `${label} erstellen`}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Titel</Label>
              <Input value={f.title ?? ""} onChange={(e) => set("title", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Dokumententyp</Label>
              <Select value={f.base_type ?? ""} onValueChange={(v) => set("base_type", v)}>
                <SelectTrigger><SelectValue placeholder="Alle Typen" /></SelectTrigger>
                <SelectContent>
                  {BASE_TYPES.map((t) => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Platzierung</Label>
              <Select value={f.placement ?? "einleitung"} onValueChange={(v) => set("placement", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="einleitung">Einleitung</SelectItem>
                  <SelectItem value="abschluss">Abschluss</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Inhalt</Label>
            <RichTextEditor
              value={f.content ?? ""}
              onChange={(html) => set("content", html)}
              placeholder="Inhalt eingeben…"
            />
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

export default function TexteTitel() {
  const { data = [], isLoading } = useDocumentTexts();
  const [tab, setTab] = useState<"text" | "titel">("text");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<DocumentText | null>(null);

  const rows = useMemo(() => data.filter((t) => t.kind === tab), [data, tab]);

  const columns: Column<DocumentText>[] = [
    {
      key: "source", header: "Quelle", width: "120px",
      render: (r) => <Badge variant="secondary">{SOURCE_LABEL[r.source] ?? r.source}</Badge>,
    },
    { key: "title", header: "Titel", filterable: true, render: (r) => <span className="text-link">{r.title}</span> },
    {
      key: "content", header: "Text", sortable: false,
      render: (r) => <span className="text-muted-foreground">{htmlToPreview(r.content)}</span>,
    },
    { key: "created_at", header: "Erstellt", width: "140px", render: (r) => fmtDate(r.created_at) },
  ];

  return (
    <div>
      <PageHeader
        title="Texte"
        subtitle="Verwaltung für Dokumente"
        actions={
          <Button onClick={() => { setEdit(null); setOpen(true); }} className="gap-1.5">
            <Plus className="h-4 w-4" /> {tab === "titel" ? "Titel" : "Text"}
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as "text" | "titel")} className="mb-4">
        <TabsList>
          <TabsTrigger value="text">TEXTE</TabsTrigger>
          <TabsTrigger value="titel">TITEL</TabsTrigger>
        </TabsList>
      </Tabs>

      <DataTable
        data={rows}
        columns={columns}
        loading={isLoading}
        getRowId={(r) => r.id}
        onRowClick={(r) => { setEdit(r); setOpen(true); }}
      />

      <TextDialog open={open} onOpenChange={setOpen} kind={tab} text={edit} />
    </div>
  );
}
