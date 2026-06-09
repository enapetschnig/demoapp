import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  useEmailTemplates,
  useUpsertEmailTemplate,
  useDeleteEmailTemplate,
  type EmailTemplate,
} from "@/hooks/queries/useAdmin";
import { Plus, Trash2, Lock } from "lucide-react";

function TemplateDialog({
  open, onOpenChange, template, onDeleted,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  template?: EmailTemplate | null;
  onDeleted?: () => void;
}) {
  const upsert = useUpsertEmailTemplate();
  const del = useDeleteEmailTemplate();
  const [f, setF] = useState<Partial<EmailTemplate>>({});
  useEffect(() => { if (open) setF(template ?? { name: "" }); }, [open, template]);
  const set = (k: keyof EmailTemplate, v: unknown) => setF((p) => ({ ...p, [k]: v }));
  const isSystem = !!template?.is_system;

  const save = async () => {
    if (!f.name) return toast.error("Bitte einen Namen angeben.");
    try {
      await upsert.mutateAsync({
        id: template?.id,
        name: f.name,
        context: f.context ?? null,
        subject: f.subject ?? null,
        body: f.body ?? null,
      });
      toast.success("Vorlage gespeichert");
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const remove = async () => {
    if (!template?.id) return;
    if (isSystem) return toast.error("System-Vorlagen können nicht gelöscht werden.");
    try {
      await del.mutateAsync(template.id);
      toast.success("Vorlage gelöscht");
      onOpenChange(false);
      onDeleted?.();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{template ? "E-Mail-Vorlage bearbeiten" : "E-Mail-Vorlage erstellen"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={f.name ?? ""} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Kontext</Label>
              <Input value={f.context ?? ""} onChange={(e) => set("context", e.target.value)} placeholder="z. B. Angebot, Rechnung" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Betreff</Label>
            <Input value={f.subject ?? ""} onChange={(e) => set("subject", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Text</Label>
            <Textarea rows={8} value={f.body ?? ""} onChange={(e) => set("body", e.target.value)} />
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
          {template && !isSystem ? (
            <Button variant="ghost" className="gap-1.5 text-destructive" onClick={remove} disabled={del.isPending}>
              <Trash2 className="h-4 w-4" /> Löschen
            </Button>
          ) : <span />}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button onClick={save} disabled={upsert.isPending}>Speichern</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function EmailTemplates() {
  const { data = [], isLoading } = useEmailTemplates();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<EmailTemplate | null>(null);

  const columns: Column<EmailTemplate>[] = [
    {
      key: "name", header: "Name", filterable: true,
      render: (r) => (
        <span className="inline-flex items-center gap-2">
          {r.is_system && <Lock className="h-3 w-3 text-muted-foreground" />}
          <span className="text-link">{r.name}</span>
        </span>
      ),
    },
    {
      key: "context", header: "Kontext", filterable: true,
      render: (r) => (r.context ? <Badge variant="secondary">{r.context}</Badge> : <span className="text-muted-foreground">—</span>),
    },
    { key: "subject", header: "Betreff", filterable: true, render: (r) => r.subject ?? <span className="text-muted-foreground">—</span> },
  ];

  return (
    <div>
      <PageHeader
        title="E-Mail-Vorlagen"
        subtitle="Vorlagen für den E-Mail-Versand"
        actions={
          <Button onClick={() => { setEdit(null); setOpen(true); }} className="gap-1.5">
            <Plus className="h-4 w-4" /> Vorlage
          </Button>
        }
      />
      <DataTable
        data={data}
        columns={columns}
        loading={isLoading}
        getRowId={(r) => r.id}
        onRowClick={(r) => { setEdit(r); setOpen(true); }}
      />
      <TemplateDialog open={open} onOpenChange={setOpen} template={edit} onDeleted={() => setEdit(null)} />
    </div>
  );
}
