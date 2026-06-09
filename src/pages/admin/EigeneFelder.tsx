import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  useCustomFieldDefs,
  useUpsertCustomFieldDef,
  useDeleteCustomFieldDef,
  type CustomFieldDef,
} from "@/hooks/queries/useAdmin";
import { Plus, Trash2 } from "lucide-react";

const FIELD_TYPES = [
  { v: "text", l: "Text" },
  { v: "checkbox", l: "Checkbox" },
  { v: "select", l: "Auswahl" },
  { v: "url", l: "URL" },
];
const typeLabel = (v: string) => FIELD_TYPES.find((t) => t.v === v)?.l ?? v;

// options jsonb → string[] robust einlesen.
function readOptions(opt: CustomFieldDef["options"]): string[] {
  if (Array.isArray(opt)) return opt.map((o) => String(o));
  return [];
}

function FieldPanel({
  field, onClose,
}: {
  field: Partial<CustomFieldDef> | null;
  onClose: () => void;
}) {
  const upsert = useUpsertCustomFieldDef();
  const del = useDeleteCustomFieldDef();
  const [f, setF] = useState<Partial<CustomFieldDef>>({});
  const [optionsText, setOptionsText] = useState("");

  useEffect(() => {
    if (field) {
      setF(field);
      setOptionsText(readOptions(field.options ?? null).join("\n"));
    }
  }, [field]);

  if (!field) return null;
  const set = (k: keyof CustomFieldDef, v: unknown) => setF((p) => ({ ...p, [k]: v }));
  const fieldType = f.field_type ?? "text";

  const save = async () => {
    if (!f.name) return toast.error("Bitte einen Namen angeben.");
    const options = fieldType === "select"
      ? optionsText.split("\n").map((s) => s.trim()).filter(Boolean)
      : null;
    try {
      await upsert.mutateAsync({
        id: f.id,
        name: f.name,
        field_type: fieldType,
        suffix: f.suffix ?? null,
        hint: f.hint ?? null,
        options,
        sort_order: f.sort_order ?? null,
      });
      toast.success("Feld gespeichert");
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const remove = async () => {
    if (!f.id) return;
    try {
      await del.mutateAsync(f.id);
      toast.success("Feld gelöscht");
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium">{f.id ? "Feld bearbeiten" : "Neues Feld"}</h2>
        {f.id && (
          <Button variant="ghost" size="icon" onClick={remove} disabled={del.isPending}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        )}
      </div>
      <div className="grid gap-4">
        <div className="space-y-1.5">
          <Label>Typ</Label>
          <Select value={fieldType} onValueChange={(v) => set("field_type", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {FIELD_TYPES.map((t) => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Name</Label>
          <Input value={f.name ?? ""} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Suffix</Label>
          <Input value={f.suffix ?? ""} onChange={(e) => set("suffix", e.target.value)} placeholder="z. B. kg, €, m²" />
        </div>
        <div className="space-y-1.5">
          <Label>Hinweis</Label>
          <Input value={f.hint ?? ""} onChange={(e) => set("hint", e.target.value)} />
        </div>
        {fieldType === "select" && (
          <div className="space-y-1.5">
            <Label>Optionen (eine pro Zeile)</Label>
            <Textarea rows={4} value={optionsText} onChange={(e) => setOptionsText(e.target.value)} />
          </div>
        )}
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Abbrechen</Button>
        <Button onClick={save} disabled={upsert.isPending}>Speichern</Button>
      </div>
    </Card>
  );
}

export default function EigeneFelder() {
  const { data = [], isLoading } = useCustomFieldDefs();
  const [panel, setPanel] = useState<Partial<CustomFieldDef> | null>(null);

  const nextSort = data.length ? Math.max(...data.map((d) => Number(d.sort_order ?? 0))) + 1 : 0;

  const columns: Column<CustomFieldDef>[] = [
    { key: "name", header: "Name", filterable: true, render: (r) => <span className="text-link">{r.name}</span> },
    { key: "field_type", header: "Typ", render: (r) => <Badge variant="secondary">{typeLabel(r.field_type)}</Badge> },
    { key: "suffix", header: "Suffix", render: (r) => r.suffix ?? <span className="text-muted-foreground">—</span> },
    { key: "hint", header: "Hinweis", sortable: false, render: (r) => r.hint ?? <span className="text-muted-foreground">—</span> },
    {
      key: "options", header: "Optionen", sortable: false,
      accessor: (r) => readOptions(r.options).length,
      render: (r) => {
        const n = readOptions(r.options).length;
        return n > 0 ? <Badge variant="outline">{n}</Badge> : <span className="text-muted-foreground">—</span>;
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Eigene Felder"
        subtitle="Benutzerdefinierte Felder"
        actions={
          <Button
            onClick={() => setPanel({ field_type: "text", sort_order: nextSort })}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" /> Feld
          </Button>
        }
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className={panel ? "lg:col-span-2" : "lg:col-span-3"}>
          <DataTable
            data={data}
            columns={columns}
            loading={isLoading}
            getRowId={(r) => r.id}
            onRowClick={(r) => setPanel(r)}
          />
        </div>
        {panel && (
          <div className="lg:col-span-1">
            <FieldPanel field={panel} onClose={() => setPanel(null)} />
          </div>
        )}
      </div>
    </div>
  );
}
