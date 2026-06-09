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
import { toast } from "sonner";
import {
  useDocumentTypesConfig, useUpdateDocumentType, useDocumentFolders, useProjectSteps,
  type DocumentTypeConfig,
} from "@/hooks/queries/useDocConfig";

const NONE = "__none__";

type FormState = {
  name: string;
  status: string;
  default_folder_id: string | null;
  move_project_to_step_id: string | null;
  subject_prefix: string;
  booking_relevant: boolean;
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
      });
    }
  }, [open, type]);

  const save = async () => {
    if (!type) return;
    if (!f.name) return toast.error("Bitte einen Namen angeben.");
    try {
      await update.mutateAsync({
        id: type.id,
        name: f.name,
        status: f.status,
        default_folder_id: f.default_folder_id,
        move_project_to_step_id: f.move_project_to_step_id,
        subject_prefix: f.subject_prefix || null,
        booking_relevant: f.booking_relevant,
      });
      toast.success("Dokumententyp gespeichert");
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
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
