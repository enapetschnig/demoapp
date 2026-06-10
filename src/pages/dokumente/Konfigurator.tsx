import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  useDocumentTypesConfig, useUpdateDocumentType, useDocumentFolders, useProjectSteps,
  type DocumentTypeConfig,
} from "@/hooks/queries/useDocConfig";

const NONE = "__none__";

type FooterMode = "nr_page" | "company_page" | "nr_company_page" | "page";

type LayoutConfig = {
  margin_top: number;
  margin_left: number;
  margin_bottom: number;
  margin_right: number;
  font_size: string;
  font_family: string;
  footer: FooterMode;
  show_letterhead: boolean;
  show_position_description: boolean;
  show_article_number: boolean;
  show_ean: boolean;
  hide_unit_prices: boolean;
  show_markup: boolean;
  show_vat: boolean;
  show_vat_rate: boolean;
  show_title_sums: boolean;
};

const DEFAULT_LAYOUT: LayoutConfig = {
  margin_top: 20,
  margin_left: 20,
  margin_bottom: 20,
  margin_right: 20,
  font_size: "11",
  font_family: "Arial",
  footer: "nr_company_page",
  show_letterhead: true,
  show_position_description: true,
  show_article_number: false,
  show_ean: false,
  hide_unit_prices: false,
  show_markup: false,
  show_vat: true,
  show_vat_rate: true,
  show_title_sums: false,
};

const FOOTER_OPTIONS: { value: FooterMode; label: string }[] = [
  { value: "nr_page", label: "Dokument-Nr./Seite" },
  { value: "company_page", label: "Firma/Seite" },
  { value: "nr_company_page", label: "Dokument-Nr./Firma/Seite" },
  { value: "page", label: "Seite" },
];

const POSITION_OPTIONS: { key: keyof LayoutConfig; label: string }[] = [
  { key: "show_position_description", label: "Positions-Beschreibung anzeigen" },
  { key: "show_article_number", label: "Artikelnummer anzeigen" },
  { key: "show_ean", label: "EAN anzeigen" },
  { key: "hide_unit_prices", label: "Einzelpreise ausblenden" },
  { key: "show_markup", label: "Aufschlag anzeigen" },
  { key: "show_vat", label: "MwSt ausweisen" },
  { key: "show_vat_rate", label: "MwSt-Satz ausweisen" },
  { key: "show_title_sums", label: "Titelsummen anzeigen" },
];

/** Liest die in document_types.layout (jsonb) abgelegte Layout-Konfiguration aus. */
function parseLayout(raw: DocumentTypeConfig["layout"]): LayoutConfig {
  const src = (raw && typeof raw === "object" && !Array.isArray(raw))
    ? (raw as Record<string, unknown>)
    : {};
  const num = (v: unknown, d: number) => (typeof v === "number" ? v : d);
  const str = (v: unknown, d: string) => (typeof v === "string" ? v : d);
  const bool = (v: unknown, d: boolean) => (typeof v === "boolean" ? v : d);
  const footer = FOOTER_OPTIONS.some((o) => o.value === src.footer)
    ? (src.footer as FooterMode)
    : DEFAULT_LAYOUT.footer;
  return {
    margin_top: num(src.margin_top, DEFAULT_LAYOUT.margin_top),
    margin_left: num(src.margin_left, DEFAULT_LAYOUT.margin_left),
    margin_bottom: num(src.margin_bottom, DEFAULT_LAYOUT.margin_bottom),
    margin_right: num(src.margin_right, DEFAULT_LAYOUT.margin_right),
    font_size: str(src.font_size, DEFAULT_LAYOUT.font_size),
    font_family: str(src.font_family, DEFAULT_LAYOUT.font_family),
    footer,
    show_letterhead: bool(src.show_letterhead, DEFAULT_LAYOUT.show_letterhead),
    show_position_description: bool(src.show_position_description, DEFAULT_LAYOUT.show_position_description),
    show_article_number: bool(src.show_article_number, DEFAULT_LAYOUT.show_article_number),
    show_ean: bool(src.show_ean, DEFAULT_LAYOUT.show_ean),
    hide_unit_prices: bool(src.hide_unit_prices, DEFAULT_LAYOUT.hide_unit_prices),
    show_markup: bool(src.show_markup, DEFAULT_LAYOUT.show_markup),
    show_vat: bool(src.show_vat, DEFAULT_LAYOUT.show_vat),
    show_vat_rate: bool(src.show_vat_rate, DEFAULT_LAYOUT.show_vat_rate),
    show_title_sums: bool(src.show_title_sums, DEFAULT_LAYOUT.show_title_sums),
  };
}

type FormState = {
  name: string;
  status: string;
  default_folder_id: string | null;
  move_project_to_step_id: string | null;
  subject_prefix: string;
  booking_relevant: boolean;
  layout: LayoutConfig;
};

function ConfigDialog({
  open, onOpenChange, type,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  type: DocumentTypeConfig | null;
}) {
  const update = useUpdateDocumentType();
  const { data: folders = [] } = useDocumentFolders();
  const { data: steps = [] } = useProjectSteps();
  const [f, setF] = useState<FormState>({
    name: "", status: "aktiv", default_folder_id: null,
    move_project_to_step_id: null, subject_prefix: "", booking_relevant: false,
    layout: DEFAULT_LAYOUT,
  });

  useEffect(() => {
    if (open && type) {
      setF({
        name: type.name,
        status: type.status,
        default_folder_id: type.default_folder_id,
        move_project_to_step_id: type.move_project_to_step_id,
        subject_prefix: type.subject_prefix ?? "",
        booking_relevant: type.booking_relevant,
        layout: parseLayout(type.layout),
      });
    }
  }, [open, type]);

  const setLayout = (patch: Partial<LayoutConfig>) =>
    setF((p) => ({ ...p, layout: { ...p.layout, ...patch } }));

  const save = async () => {
    if (!type) return;
    if (!f.name) return toast.error("Bitte einen Namen angeben.");
    // Bestehendes layout-jsonb beibehalten und nur die bekannten Layout-Felder mergen.
    const existingLayout = (type.layout && typeof type.layout === "object" && !Array.isArray(type.layout))
      ? (type.layout as Record<string, unknown>)
      : {};
    const mergedLayout = { ...existingLayout, ...f.layout };
    try {
      await update.mutateAsync({
        id: type.id,
        name: f.name,
        status: f.status,
        default_folder_id: f.default_folder_id,
        move_project_to_step_id: f.move_project_to_step_id,
        subject_prefix: f.subject_prefix || null,
        booking_relevant: f.booking_relevant,
        layout: mergedLayout,
      });
      toast.success("Dokumententyp gespeichert");
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Dokumententyp bearbeiten</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4 pt-1">
          <div className="col-span-2 space-y-1.5">
            <Label>Name</Label>
            <Input value={f.name} onChange={(e) => setF((p) => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={f.status} onValueChange={(v) => setF((p) => ({ ...p, status: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="aktiv">Aktiv</SelectItem>
                <SelectItem value="inaktiv">Inaktiv</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Standardordner</Label>
            <Select
              value={f.default_folder_id ?? NONE}
              onValueChange={(v) => setF((p) => ({ ...p, default_folder_id: v === NONE ? null : v }))}
            >
              <SelectTrigger><SelectValue placeholder="Kein Ordner" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Kein Ordner</SelectItem>
                {folders.map((fo) => <SelectItem key={fo.id} value={fo.id}>{fo.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Projekt nach Erstellung verschieben in</Label>
            <Select
              value={f.move_project_to_step_id ?? NONE}
              onValueChange={(v) => setF((p) => ({ ...p, move_project_to_step_id: v === NONE ? null : v }))}
            >
              <SelectTrigger><SelectValue placeholder="Nicht verschieben" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Nicht verschieben</SelectItem>
                {steps.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Betreff-Präfix</Label>
            <Input
              value={f.subject_prefix}
              onChange={(e) => setF((p) => ({ ...p, subject_prefix: e.target.value }))}
            />
          </div>
          <div className="col-span-2 flex items-center gap-2 pt-1">
            <Checkbox
              id="booking_relevant"
              checked={f.booking_relevant}
              onCheckedChange={(c) => setF((p) => ({ ...p, booking_relevant: c === true }))}
            />
            <Label htmlFor="booking_relevant" className="cursor-pointer">Buchungsrelevant</Label>
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t mt-4">
          <Label className="text-base font-semibold">Layout</Label>
          <Tabs defaultValue="design">
            <TabsList>
              <TabsTrigger value="design">Allgemeine Gestaltung</TabsTrigger>
              <TabsTrigger value="positions">Positionen</TabsTrigger>
            </TabsList>

            <TabsContent value="design" className="pt-2">
              <div className="space-y-1.5">
                <Label>Seitenränder (mm)</Label>
                <div className="grid grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Oben</Label>
                    <Input
                      type="number"
                      value={f.layout.margin_top}
                      onChange={(e) => setLayout({ margin_top: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Links</Label>
                    <Input
                      type="number"
                      value={f.layout.margin_left}
                      onChange={(e) => setLayout({ margin_left: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Unten</Label>
                    <Input
                      type="number"
                      value={f.layout.margin_bottom}
                      onChange={(e) => setLayout({ margin_bottom: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Rechts</Label>
                    <Input
                      type="number"
                      value={f.layout.margin_right}
                      onChange={(e) => setLayout({ margin_right: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="space-y-1.5">
                  <Label>Schriftgröße</Label>
                  <Select value={f.layout.font_size} onValueChange={(v) => setLayout({ font_size: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="9">9pt</SelectItem>
                      <SelectItem value="10">10pt</SelectItem>
                      <SelectItem value="11">11pt</SelectItem>
                      <SelectItem value="12">12pt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Schriftart</Label>
                  <Select value={f.layout.font_family} onValueChange={(v) => setLayout({ font_family: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Arial">Arial</SelectItem>
                      <SelectItem value="Helvetica">Helvetica</SelectItem>
                      <SelectItem value="Roboto">Roboto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Fußzeile</Label>
                  <Select
                    value={f.layout.footer}
                    onValueChange={(v) => setLayout({ footer: v as FooterMode })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FOOTER_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4">
                <Checkbox
                  id="show_letterhead"
                  checked={f.layout.show_letterhead}
                  onCheckedChange={(c) => setLayout({ show_letterhead: c === true })}
                />
                <Label htmlFor="show_letterhead" className="cursor-pointer">Briefpapier anzeigen</Label>
              </div>
            </TabsContent>

            <TabsContent value="positions" className="pt-2">
              <div className="grid grid-cols-2 gap-3">
                {POSITION_OPTIONS.map((o) => (
                  <div key={o.key} className="flex items-center gap-2">
                    <Checkbox
                      id={o.key}
                      checked={f.layout[o.key] === true}
                      onCheckedChange={(c) => setLayout({ [o.key]: c === true } as Partial<LayoutConfig>)}
                    />
                    <Label htmlFor={o.key} className="cursor-pointer">{o.label}</Label>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button onClick={save} disabled={update.isPending}>Speichern</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Konfigurator() {
  const { data = [], isLoading } = useDocumentTypesConfig();
  const { data: folders = [] } = useDocumentFolders();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<DocumentTypeConfig | null>(null);

  const folderName = (id: string | null) =>
    id ? (folders.find((f) => f.id === id)?.name ?? "—") : "—";

  const columns: Column<DocumentTypeConfig>[] = [
    { key: "name", header: "Name", filterable: true, render: (r) => <span className="text-link">{r.name}</span> },
    { key: "default_folder_id", header: "Standardordner", render: (r) => folderName(r.default_folder_id) },
    {
      key: "status", header: "Status", width: "120px",
      render: (r) => (
        <Badge variant={r.status === "aktiv" ? "default" : "secondary"}>
          {r.status === "aktiv" ? "Aktiv" : "Inaktiv"}
        </Badge>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Dokumentenkonfigurator" subtitle="Verwaltung der Dokumententypen" />
      <DataTable
        data={data}
        columns={columns}
        loading={isLoading}
        getRowId={(r) => r.id}
        onRowClick={(r) => { setEdit(r); setOpen(true); }}
      />
      <ConfigDialog open={open} onOpenChange={setOpen} type={edit} />
    </div>
  );
}
