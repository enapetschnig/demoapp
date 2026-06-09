import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useProjectTypes, useCreateProject } from "@/hooks/queries/useProjects";
import { useContacts } from "@/hooks/queries/useContacts";

export function CreateProjectDialog({ open, onOpenChange, defaultTypeId }: { open: boolean; onOpenChange: (o: boolean) => void; defaultTypeId?: string }) {
  const navigate = useNavigate();
  const { company } = useAuth();
  const { data: types = [] } = useProjectTypes();
  const { data: contacts = [] } = useContacts();
  const create = useCreateProject();

  const { data: sources = [] } = useQuery({
    queryKey: ["sources", company?.id],
    enabled: !!company?.id && open,
    queryFn: async () => (await supabase.from("project_sources").select("id,name").eq("company_id", company!.id).order("name")).data ?? [],
  });

  const [typeId, setTypeId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [name, setName] = useState("");
  const [street, setStreet] = useState("");
  const [zip, setZip] = useState("");
  const [city, setCity] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [value, setValue] = useState("");

  useEffect(() => {
    if (open) {
      setTypeId(defaultTypeId ?? types.find((t) => t.is_standard)?.id ?? types[0]?.id ?? "");
      setCustomerId(""); setName(""); setStreet(""); setZip(""); setCity(""); setSourceId(""); setValue("");
    }
  }, [open, defaultTypeId, types]);

  const save = async () => {
    if (!typeId) return toast.error("Bitte ein Gewerk wählen.");
    const type = types.find((t) => t.id === typeId);
    const firstStep = type?.steps?.[0]?.id ?? null;
    try {
      const proj = await create.mutateAsync({
        project_type_id: typeId,
        customer_id: customerId || null,
        name, address_street: street, address_zip: zip, address_city: city,
        source_id: sourceId || null,
        value: value ? Number(value.replace(",", ".")) : 0,
        current_step_id: firstStep,
      });
      toast.success("Projekt angelegt");
      onOpenChange(false);
      navigate(`/projekte/${proj.id}`);
    } catch (e) { toast.error((e as Error).message); }
  };

  const contactLabel = (c: typeof contacts[number]) =>
    [c.first_name, c.last_name].filter(Boolean).join(" ") || c.company_name || c.customer_number || "Kontakt";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Neues Projekt</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="space-y-1.5">
            <Label>Gewerk</Label>
            <Select value={typeId} onValueChange={setTypeId}>
              <SelectTrigger><SelectValue placeholder="Gewerk wählen" /></SelectTrigger>
              <SelectContent>{types.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Kunde</Label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger><SelectValue placeholder="Kunde wählen" /></SelectTrigger>
              <SelectContent>{contacts.map((c) => <SelectItem key={c.id} value={c.id}>{contactLabel(c)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-1.5"><Label>Projektname</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="col-span-2 space-y-1.5"><Label>Projektanschrift</Label><Input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Straße" /></div>
          <div className="space-y-1.5"><Label>PLZ</Label><Input value={zip} onChange={(e) => setZip(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Ort</Label><Input value={city} onChange={(e) => setCity(e.target.value)} /></div>
          <div className="space-y-1.5">
            <Label>Quelle</Label>
            <Select value={sourceId} onValueChange={setSourceId}>
              <SelectTrigger><SelectValue placeholder="Quelle" /></SelectTrigger>
              <SelectContent>{sources.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Projektwert (€)</Label><Input value={value} onChange={(e) => setValue(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button onClick={save} disabled={create.isPending}>Anlegen</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
