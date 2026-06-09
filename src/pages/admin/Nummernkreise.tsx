import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { fmtNumber } from "@/lib/format";
import {
  useNumberRanges,
  useUpsertNumberRange,
  type NumberRange,
} from "@/hooks/queries/useAdminConfig";

function RangeDialog({
  open, onOpenChange, range,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  range?: NumberRange | null;
}) {
  const upsert = useUpsertNumberRange();
  const [f, setF] = useState<Partial<NumberRange>>({});
  useEffect(() => { if (open) setF(range ?? {}); }, [open, range]);
  const set = (k: keyof NumberRange, v: unknown) => setF((p) => ({ ...p, [k]: v }));
  const intVal = (v: string) => (v === "" ? 0 : Math.trunc(Number(v.replace(/[^0-9]/g, ""))));

  const save = async () => {
    if (!f.name) return toast.error("Bitte einen Namen angeben.");
    try {
      await upsert.mutateAsync({
        id: range?.id,
        key: f.key ?? range?.key,
        name: f.name,
        prefix: f.prefix ?? "",
        start_number: Number(f.start_number ?? 0),
        next_number: Number(f.next_number ?? 0),
      });
      toast.success("Nummernkreis gespeichert");
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{range ? "Nummernkreis bearbeiten" : "Nummernkreis"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 pt-2">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={f.name ?? ""} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Präfix</Label>
            <Input value={f.prefix ?? ""} onChange={(e) => set("prefix", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Startnummer</Label>
              <Input value={String(f.start_number ?? 0)} onChange={(e) => set("start_number", intVal(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label>Nächste Nummer</Label>
              <Input value={String(f.next_number ?? 0)} onChange={(e) => set("next_number", intVal(e.target.value))} />
            </div>
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

export default function Nummernkreise() {
  const { data = [], isLoading } = useNumberRanges();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<NumberRange | null>(null);

  const columns: Column<NumberRange>[] = [
    { key: "name", header: "Name", filterable: true, render: (r) => <span className="text-link">{r.name}</span> },
    { key: "prefix", header: "Präfix", filterable: true, render: (r) => r.prefix || "—" },
    { key: "next_number", header: "Nächste Nummer", className: "text-right", render: (r) => fmtNumber(Number(r.next_number), 0) },
  ];

  return (
    <div>
      <PageHeader title="Nummernkreise" subtitle="Präfixe & laufende Nummern für Belege" />
      <DataTable
        data={data}
        columns={columns}
        loading={isLoading}
        getRowId={(r) => r.id}
        onRowClick={(r) => { setEdit(r); setOpen(true); }}
      />
      <RangeDialog open={open} onOpenChange={setOpen} range={edit} />
    </div>
  );
}
