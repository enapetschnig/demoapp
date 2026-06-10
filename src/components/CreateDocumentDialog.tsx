import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem,
} from "@/components/ui/command";
import { ContactDialog } from "@/components/ContactDialog";
import { useContacts } from "@/hooks/queries/useContacts";
import { useProjects } from "@/hooks/queries/useProjects";
import { useSaveDocument, type SaveItem } from "@/hooks/queries/useDocuments";
import { DOC_TYPES } from "@/lib/documentTypes";
import { toast } from "sonner";
import { ChevronsUpDown, Plus, X, User, FolderKanban } from "lucide-react";

// Von überall aufrufbar, um den "Dokument erstellen"-Dialog zu öffnen.
export const openCreateDocument = () => window.dispatchEvent(new CustomEvent("open-create-document"));

type Picked =
  | { kind: "contact"; id: string; label: string; customerId: string }
  | { kind: "project"; id: string; label: string; customerId: string | null };

export function CreateDocumentDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const navigate = useNavigate();
  const { data: contacts = [] } = useContacts();
  const { data: projects = [] } = useProjects();
  const saveDoc = useSaveDocument();

  const [picked, setPicked] = useState<Picked | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [contactDialog, setContactDialog] = useState(false);
  const [baseType, setBaseType] = useState("");
  const [takeover, setTakeover] = useState<"leer" | "kopieren" | "folge">("leer");
  const [sourceDocId, setSourceDocId] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) { setPicked(null); setBaseType(""); setTakeover("leer"); setSourceDocId(""); }
  }, [open]);

  // Quelldokumente des gewählten Kontakts/Projekts (für Positionsübernahme)
  const customerId = picked?.customerId ?? null;
  const projectId = picked?.kind === "project" ? picked.id : null;
  const { sourceDocs } = useSourceDocs(open && takeover !== "leer", customerId, projectId);

  const contactName = (c: typeof contacts[number]) =>
    [c.first_name, c.last_name].filter(Boolean).join(" ") || c.company_name || c.customer_number || "Kontakt";

  const weiter = async () => {
    if (!baseType) return toast.error("Bitte einen Dokumenttyp wählen.");
    setBusy(true);
    try {
      let items: SaveItem[] = [];
      if (takeover !== "leer" && sourceDocId) {
        const { data } = await supabase.from("document_items").select("*").eq("document_id", sourceDocId).order("sort_order");
        items = (data ?? []).map((it) => ({
          kind: it.kind, article_id: it.article_id, service_id: it.service_id,
          name: it.name ?? "", description: it.description ?? "", quantity: Number(it.quantity ?? 1),
          unit: it.unit ?? "", unit_price: Number(it.unit_price ?? 0), purchase_price: Number(it.purchase_price ?? 0),
          markup_percent: Number(it.markup_percent ?? 0), discount_percent: Number(it.discount_percent ?? 0),
          vat_rate: Number(it.vat_rate ?? 20), time_minutes: Number(it.time_minutes ?? 0),
        }));
      }
      const id = await saveDoc.mutateAsync({
        base_type: baseType,
        customer_id: customerId,
        project_id: projectId,
        items,
      });
      if (takeover === "folge" && sourceDocId) {
        await supabase.from("documents").update({ reference_document_id: sourceDocId }).eq("id", id);
      }
      onOpenChange(false);
      navigate(`/dokumente/${id}`);
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Dokument erstellen</DialogTitle></DialogHeader>

          <div className="space-y-4 py-2">
            {/* Projekt / Kontakt */}
            <div className="space-y-1.5">
              <Label>Projekt / Kontakt</Label>
              <div className="flex gap-2">
                <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="flex-1 justify-between font-normal">
                      {picked ? <span className="truncate">{picked.label}</span> : <span className="text-muted-foreground">Bitte auswählen</span>}
                      <span className="flex items-center gap-1">
                        {picked && <X className="h-4 w-4 opacity-60" onClick={(e) => { e.stopPropagation(); setPicked(null); }} />}
                        <ChevronsUpDown className="h-4 w-4 opacity-50" />
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[26rem] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Kontakt oder Projekt suchen…" />
                      <CommandList>
                        <CommandEmpty>Keine Ergebnisse gefunden.</CommandEmpty>
                        <CommandGroup heading="Kontakte">
                          {contacts.map((c) => (
                            <CommandItem key={`c-${c.id}`} value={`${c.customer_number ?? ""} ${contactName(c)} ${c.category} ${c.address_city ?? ""}`}
                              onSelect={() => { setPicked({ kind: "contact", id: c.id, label: contactName(c), customerId: c.id }); setPickerOpen(false); }}>
                              <User className="mr-2 h-4 w-4 text-muted-foreground" />
                              <div className="min-w-0">
                                <div className="truncate">{contactName(c)} <span className="text-xs text-muted-foreground">· {c.category}</span></div>
                                <div className="truncate text-xs text-muted-foreground">{c.customer_number ?? ""} {[c.address_street, c.address_city].filter(Boolean).join(", ")}</div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                        <CommandGroup heading="Projekte">
                          {projects.map((p) => (
                            <CommandItem key={`p-${p.id}`} value={`PRJ-${p.project_number} ${p.name ?? ""} ${p.address_city ?? ""}`}
                              onSelect={() => { setPicked({ kind: "project", id: p.id, label: `${p.project_types?.code ?? "PRJ"}-${p.project_number}${p.name ? ` · ${p.name}` : ""}`, customerId: p.customer_id }); setPickerOpen(false); }}>
                              <FolderKanban className="mr-2 h-4 w-4 text-muted-foreground" />
                              <div className="min-w-0">
                                <div className="truncate">{p.project_types?.code ?? "PRJ"}-{p.project_number} {p.name ? `· ${p.name}` : ""}</div>
                                <div className="truncate text-xs text-muted-foreground">{[p.address_street, p.address_city].filter(Boolean).join(", ")}</div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Button variant="secondary" size="icon" title="Neuen Kontakt anlegen" onClick={() => setContactDialog(true)}><Plus className="h-4 w-4" /></Button>
              </div>
            </div>

            {/* Typ */}
            <div className="space-y-1.5">
              <Label>Typ</Label>
              <Select value={baseType} onValueChange={setBaseType}>
                <SelectTrigger><SelectValue placeholder="Bitte auswählen" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {Object.values(DOC_TYPES)
                    .filter((t) => !["mahnung", "stornorechnung", "kalkulation"].includes(t.base))
                    .map((t) => <SelectItem key={t.base} value={t.base}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Positionsübernahme */}
            <div className="space-y-2">
              <Label>Positionsübernahme</Label>
              <RadioGroup value={takeover} onValueChange={(v) => setTakeover(v as typeof takeover)} className="gap-2">
                <label className="flex items-start gap-2 text-sm"><RadioGroupItem value="leer" className="mt-0.5" /> <span><b>Keine Positionsübernahme</b> (Leeres Dokument)</span></label>
                <label className="flex items-start gap-2 text-sm"><RadioGroupItem value="kopieren" className="mt-0.5" /> <span><b>Positionen übernehmen</b> (ohne Referenz)</span></label>
                <label className="flex items-start gap-2 text-sm"><RadioGroupItem value="folge" className="mt-0.5" /> <span><b>Als Folgedokument anlegen</b> (mit Verknüpfung)</span></label>
              </RadioGroup>
              {takeover !== "leer" && (
                <div className="pt-1">
                  <Select value={sourceDocId} onValueChange={setSourceDocId}>
                    <SelectTrigger><SelectValue placeholder={sourceDocs.length ? "Quelldokument wählen" : "Keine Dokumente vorhanden"} /></SelectTrigger>
                    <SelectContent>
                      {sourceDocs.map((d) => <SelectItem key={d.id} value={d.id}>{d.number ?? "Entwurf"} · {DOC_TYPES[d.base_type as keyof typeof DOC_TYPES]?.label ?? d.base_type}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button onClick={weiter} disabled={busy}>Weiter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ContactDialog open={contactDialog} onOpenChange={setContactDialog} />
    </>
  );
}

function useSourceDocs(enabled: boolean, customerId: string | null, projectId: string | null) {
  const [sourceDocs, setSourceDocs] = useState<{ id: string; number: string | null; base_type: string }[]>([]);
  useEffect(() => {
    if (!enabled || (!customerId && !projectId)) { setSourceDocs([]); return; }
    let active = true;
    (async () => {
      let q = supabase.from("documents").select("id,number,base_type").eq("is_deleted", false).order("created_at", { ascending: false });
      if (projectId) q = q.eq("project_id", projectId);
      else if (customerId) q = q.eq("customer_id", customerId);
      const { data } = await q;
      if (active) setSourceDocs(data ?? []);
    })();
    return () => { active = false; };
  }, [enabled, customerId, projectId]);
  return { sourceDocs };
}
