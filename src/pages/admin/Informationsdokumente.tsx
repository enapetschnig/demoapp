import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface InfoDoc extends Record<string, unknown> {
  id: string;
  name: string;
  status: string;
}

// Platzhalter-Daten: Informationsdokumente sind noch nicht persistiert.
const PLACEHOLDER: InfoDoc[] = [
  { id: "1", name: "Datenschutzhinweis", status: "Entwurf" },
  { id: "2", name: "Widerrufsbelehrung", status: "Entwurf" },
  { id: "3", name: "AGB", status: "Entwurf" },
];

function InfoDocDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [name, setName] = useState("");

  const save = () => {
    if (!name) return toast.error("Bitte einen Namen angeben.");
    toast.info("Informationsdokumente können noch nicht gespeichert werden.");
    onOpenChange(false);
    setName("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Informationsdokument</DialogTitle>
        </DialogHeader>
        <div className="space-y-1.5 pt-2">
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button onClick={save}>Speichern</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Informationsdokumente() {
  const [open, setOpen] = useState(false);

  const columns: Column<InfoDoc>[] = [
    { key: "name", header: "Name", filterable: true, render: (r) => <span className="text-link">{r.name}</span> },
    { key: "status", header: "Status", render: (r) => <Badge variant="secondary">{r.status}</Badge> },
  ];

  return (
    <div>
      <PageHeader
        title="Informationsdokumente"
        subtitle="Vorlagen für Kundeninformationen"
        actions={
          <Button onClick={() => setOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Informationsdokument
          </Button>
        }
      />
      <DataTable data={PLACEHOLDER} columns={columns} getRowId={(r) => r.id} />
      <InfoDocDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
