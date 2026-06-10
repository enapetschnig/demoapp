import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { NAV } from "@/lib/navigation";
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem,
} from "@/components/ui/command";
import { Users, FolderKanban, FileText, ArrowRight } from "lucide-react";

const NAV_TARGETS = NAV.flatMap((i) =>
  i.to ? [{ label: i.label, to: i.to }] : (i.children ?? []).map((c) => ({ label: `${i.label} › ${c.label}`, to: c.to })),
);

export function GlobalSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const navigate = useNavigate();
  const { company } = useAuth();
  const [q, setQ] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const { data: results } = useQuery({
    queryKey: ["global-search", company?.id, q],
    enabled: !!company?.id && q.trim().length >= 2,
    queryFn: async () => {
      const like = `%${q.trim()}%`;
      const [c, p, d] = await Promise.all([
        supabase.from("contacts").select("id,first_name,last_name,company_name,customer_number")
          .eq("company_id", company!.id).or(`first_name.ilike.${like},last_name.ilike.${like},company_name.ilike.${like},customer_number.ilike.${like}`).limit(6),
        supabase.from("projects").select("id,project_number,name").eq("company_id", company!.id).or(`name.ilike.${like}`).limit(6),
        supabase.from("documents").select("id,number,subject,base_type").eq("company_id", company!.id).or(`number.ilike.${like},subject.ilike.${like}`).limit(6),
      ]);
      return { contacts: c.data ?? [], projects: p.data ?? [], documents: d.data ?? [] };
    },
  });

  const go = (to: string) => { onOpenChange(false); setQ(""); navigate(to); };
  const navMatches = NAV_TARGETS.filter((t) => t.label.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 6);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Suche Projekte, Kontakte, Dokumente … oder navigieren" value={q} onValueChange={setQ} />
      <CommandList>
        <CommandEmpty>Keine Ergebnisse.</CommandEmpty>
        {navMatches.length > 0 && (
          <CommandGroup heading="Navigation">
            {navMatches.map((t) => (
              <CommandItem key={t.to} value={`nav-${t.label}`} onSelect={() => go(t.to)}>
                <ArrowRight className="mr-2 h-4 w-4 text-muted-foreground" />{t.label}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {results?.contacts.length ? (
          <CommandGroup heading="Kontakte">
            {results.contacts.map((c) => (
              <CommandItem key={c.id} value={`k-${c.id}`} onSelect={() => go(`/kontakte/${c.id}`)}>
                <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                {[c.first_name, c.last_name].filter(Boolean).join(" ") || c.company_name || c.customer_number}
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}
        {results?.projects.length ? (
          <CommandGroup heading="Projekte">
            {results.projects.map((p) => (
              <CommandItem key={p.id} value={`p-${p.id}`} onSelect={() => go(`/projekte/${p.id}`)}>
                <FolderKanban className="mr-2 h-4 w-4 text-muted-foreground" />PRJ-{p.project_number}{p.name ? ` · ${p.name}` : ""}
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}
        {results?.documents.length ? (
          <CommandGroup heading="Dokumente">
            {results.documents.map((d) => (
              <CommandItem key={d.id} value={`d-${d.id}`} onSelect={() => go(`/dokumente/${d.id}`)}>
                <FileText className="mr-2 h-4 w-4 text-muted-foreground" />{d.number ?? "Entwurf"}{d.subject ? ` · ${d.subject}` : ""}
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
}
