import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useContact } from "@/hooks/queries/useContacts";
import { ContactDialog } from "@/components/ContactDialog";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { fmtEUR, fmtDate, fmtDateTime } from "@/lib/format";
import { docLabel } from "@/lib/documentTypes";
import { Pencil, Mail, Phone, MapPin, ArrowLeft } from "lucide-react";

export default function KontaktDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: contact, isLoading } = useContact(id);
  const [editOpen, setEditOpen] = useState(false);

  const { data: documents = [] } = useQuery({
    queryKey: ["contact-docs", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase.from("documents").select("id,base_type,number,gross_amount,status,doc_date").eq("customer_id", id!).order("doc_date", { ascending: false });
      return data ?? [];
    },
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["contact-projects", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase.from("projects").select("id,project_number,name,value").eq("customer_id", id!).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: log = [] } = useQuery({
    queryKey: ["contact-log", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase.from("activity_log").select("*").eq("entity_type", "contact").eq("entity_id", id!).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  if (isLoading) return <div className="text-muted-foreground">Lädt…</div>;
  if (!contact) return <div className="text-muted-foreground">Kontakt nicht gefunden.</div>;

  const name = [contact.salutation, contact.first_name, contact.last_name].filter(Boolean).join(" ") || contact.company_name || "Kontakt";

  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-2 gap-1.5 text-muted-foreground" onClick={() => navigate("/kontakte")}>
        <ArrowLeft className="h-4 w-4" /> Zurück
      </Button>
      <PageHeader
        title={name}
        subtitle={contact.customer_number ? `Kundennummer ${contact.customer_number}` : undefined}
        actions={<Button variant="secondary" className="gap-1.5" onClick={() => setEditOpen(true)}><Pencil className="h-4 w-4" /> Bearbeiten</Button>}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="space-y-3 p-5">
          <h3 className="font-medium">Stammdaten</h3>
          <div className="space-y-2 text-sm">
            <Badge variant="secondary" className="capitalize">{contact.category}</Badge>
            {contact.company_name && <div>{contact.company_name}</div>}
            {contact.email && <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4" />{contact.email}</div>}
            {(contact.phone || contact.mobile) && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" />{contact.phone || contact.mobile}</div>}
            {(contact.address_street || contact.address_city) && (
              <div className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4" />
                <span>{contact.address_street}<br />{contact.address_zip} {contact.address_city}</span>
              </div>
            )}
            {contact.notes && <p className="border-t pt-2 text-muted-foreground">{contact.notes}</p>}
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <Tabs defaultValue="dokumente">
            <TabsList>
              <TabsTrigger value="dokumente">Dokumente ({documents.length})</TabsTrigger>
              <TabsTrigger value="projekte">Projekte ({projects.length})</TabsTrigger>
              <TabsTrigger value="logbuch">Logbuch</TabsTrigger>
            </TabsList>

            <TabsContent value="dokumente" className="pt-3">
              {documents.length === 0 ? <p className="text-sm text-muted-foreground">Keine Dokumente.</p> : (
                <div className="divide-y">
                  {documents.map((d) => (
                    <div key={d.id} className="flex items-center justify-between py-2 text-sm cursor-pointer hover:bg-muted/40 px-2 -mx-2 rounded" onClick={() => navigate(`/dokumente/${d.id}`)}>
                      <span><span className="text-link">{d.number ?? "Entwurf"}</span> · {docLabel(d.base_type)}</span>
                      <span className="text-muted-foreground">{fmtDate(d.doc_date)} · {fmtEUR(Number(d.gross_amount))}</span>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="projekte" className="pt-3">
              {projects.length === 0 ? <p className="text-sm text-muted-foreground">Keine Projekte.</p> : (
                <div className="divide-y">
                  {projects.map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-2 text-sm cursor-pointer hover:bg-muted/40 px-2 -mx-2 rounded" onClick={() => navigate(`/projekte/${p.id}`)}>
                      <span className="text-link">PRJ-{p.project_number}{p.name ? ` · ${p.name}` : ""}</span>
                      <span className="text-muted-foreground">{fmtEUR(Number(p.value))}</span>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="logbuch" className="pt-3">
              {log.length === 0 ? <p className="text-sm text-muted-foreground">Noch keine Einträge.</p> : (
                <div className="space-y-3">
                  {log.map((l) => (
                    <div key={l.id} className="border-l-2 border-primary pl-3 text-sm">
                      <div className="text-xs text-link">{fmtDateTime(l.created_at)}</div>
                      <div className="font-medium">{l.title}</div>
                      <div className="text-muted-foreground">{l.message}</div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      <ContactDialog open={editOpen} onOpenChange={setEditOpen} contact={contact} />
    </div>
  );
}
