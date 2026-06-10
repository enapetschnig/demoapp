import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProject, useProjectTypes, useMoveProjectStep, useActivityLog, useAddLogEntry } from "@/hooks/queries/useProjects";
import { useAuth } from "@/contexts/AuthContext";
import { useProjectChecklists, useUpsertProjectChecklist, useDeleteProjectChecklist, useChecklistTemplates, type ChecklistItem } from "@/hooks/queries/useDetailExtras";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { fmtEUR, fmtDate, fmtDateTime, fmtNumber } from "@/lib/format";
import { docLabel } from "@/lib/documentTypes";
import { toast } from "sonner";
import { ArrowLeft, MapPin, User, FilePlus, GitBranch, ListChecks, FileText, MessageSquarePlus, CheckSquare, CalendarDays, Users, Image as ImageIcon, Clock, Package, BarChart3, Upload, ClipboardCheck, Plus, Trash2 } from "lucide-react";

const TABS = [
  { v: "logbuch", l: "Logbuch", icon: ListChecks },
  { v: "bilder", l: "Bilder", icon: ImageIcon },
  { v: "dokumente", l: "Dokumente", icon: FileText },
  { v: "zeitlohn", l: "Zeit & Lohn", icon: Clock },
  { v: "termine", l: "Termine", icon: CalendarDays },
  { v: "aufgaben", l: "Aufgaben", icon: CheckSquare },
  { v: "material", l: "Materialbelege", icon: Package },
  { v: "sollist", l: "Soll/Ist", icon: BarChart3 },
  { v: "checklisten", l: "Checklisten", icon: ClipboardCheck },
  { v: "beteiligte", l: "Beteiligte", icon: Users },
];

export default function ProjektDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { company } = useAuth();
  const { data: project, isLoading } = useProject(id);
  const { data: types = [] } = useProjectTypes();
  const move = useMoveProjectStep();
  const { data: log = [] } = useActivityLog("project", id);
  const addLog = useAddLogEntry();
  const [tab, setTab] = useState("logbuch");
  const [comment, setComment] = useState("");

  const { data: documents = [] } = useQuery({
    queryKey: ["project-docs", id, company?.id],
    enabled: !!id && !!company?.id,
    queryFn: async () => (await supabase.from("documents").select("id,base_type,number,gross_amount,status,doc_date").eq("company_id", company!.id).eq("project_id", id!).order("doc_date", { ascending: false })).data ?? [],
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["project-tasks", id, company?.id],
    enabled: !!id && !!company?.id,
    queryFn: async () => (await supabase.from("tasks").select("id,title,due_date,done_at").eq("company_id", company!.id).eq("project_id", id!).order("due_date", { ascending: true, nullsFirst: false })).data ?? [],
  });

  const { data: termine = [] } = useQuery({
    queryKey: ["project-termine", id, company?.id],
    enabled: !!id && !!company?.id,
    queryFn: async () => (await supabase.from("appointments").select("id,title,start_at,end_at").eq("company_id", company!.id).eq("project_id", id!).order("start_at", { ascending: true })).data ?? [],
  });

  const { data: zeiten = [] } = useQuery({
    queryKey: ["project-zeit", id, company?.id],
    enabled: !!id && !!company?.id,
    queryFn: async () => (await supabase.from("time_entries")
      .select("id,entry_date,duration_minutes,break_minutes,employee:employee_id(first_name,last_name),category:category_id(name)")
      .eq("company_id", company!.id).eq("project_id", id!).order("entry_date", { ascending: false })).data ?? [],
  });

  const { data: belege = [] } = useQuery({
    queryKey: ["project-belege", id, company?.id],
    enabled: !!id && !!company?.id,
    queryFn: async () => (await supabase.from("receipts")
      .select("id,receipt_number,category,gross_amount,doc_date,type")
      .eq("company_id", company!.id).eq("project_id", id!).order("doc_date", { ascending: false })).data ?? [],
  });

  const { data: bilder = [], refetch: refetchBilder } = useQuery({
    queryKey: ["project-bilder", id, company?.id],
    enabled: !!id && !!company?.id,
    queryFn: async () => {
      const { data } = await supabase.storage.from("project-files").list(`${company!.id}/${id}`, { sortBy: { column: "created_at", order: "desc" } });
      return (data ?? []).filter((f) => f.name !== ".emptyFolderPlaceholder").map((f) => ({
        name: f.name,
        url: supabase.storage.from("project-files").getPublicUrl(`${company!.id}/${id}/${f.name}`).data.publicUrl,
      }));
    },
  });

  const uploadBild = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !company || !id) return;
    const path = `${company.id}/${id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("project-files").upload(path, file, { upsert: true, contentType: file.type });
    if (error) return toast.error(error.message);
    toast.success("Bild hochgeladen");
    refetchBilder();
  };

  // Soll/Ist (Nachkalkulation)
  const istMaterial = belege.filter((b) => b.type !== "einnahme").reduce((s, b) => s + Number(b.gross_amount ?? 0), 0);
  const istStunden = zeiten.reduce((s, z) => s + (Number(z.duration_minutes ?? 0) - Number(z.break_minutes ?? 0)) / 60, 0);
  const istLohn = istStunden * 35;

  const { data: checklists = [] } = useProjectChecklists(id);
  const { data: clTemplates = [] } = useChecklistTemplates();
  const upsertChecklist = useUpsertProjectChecklist();
  const delChecklist = useDeleteProjectChecklist();
  const [newItemText, setNewItemText] = useState<Record<string, string>>({});

  const itemsOf = (cl: { items: unknown }): ChecklistItem[] =>
    Array.isArray(cl.items) ? (cl.items as ChecklistItem[]) : [];

  const addChecklist = async (tpl?: { name: string; items: unknown }) => {
    const items: ChecklistItem[] = Array.isArray(tpl?.items)
      ? (tpl!.items as unknown[]).map((x) => ({ text: typeof x === "string" ? x : String((x as { text?: string })?.text ?? ""), done: false }))
      : [];
    await upsertChecklist.mutateAsync({ project_id: id!, name: tpl?.name ?? "Checkliste", items });
  };
  const toggleItem = async (cl: { id: string; name: string; items: unknown }, idx: number) => {
    const items = itemsOf(cl).map((it, i) => (i === idx ? { ...it, done: !it.done } : it));
    await upsertChecklist.mutateAsync({ id: cl.id, project_id: id!, name: cl.name, items });
  };
  const addItem = async (cl: { id: string; name: string; items: unknown }) => {
    const text = (newItemText[cl.id] ?? "").trim();
    if (!text) return;
    await upsertChecklist.mutateAsync({ id: cl.id, project_id: id!, name: cl.name, items: [...itemsOf(cl), { text, done: false }] });
    setNewItemText((s) => ({ ...s, [cl.id]: "" }));
  };

  if (isLoading) return <div className="text-muted-foreground">Lädt…</div>;
  if (!project) return <div className="text-muted-foreground">Projekt nicht gefunden.</div>;

  const type = types.find((t) => t.id === project.project_type_id);
  const steps = type?.steps ?? [];
  const projId = `${project.project_types?.code ?? "PRJ"}-${project.project_number}`;
  const cust = [project.customer?.first_name, project.customer?.last_name].filter(Boolean).join(" ") || project.customer?.company_name || "Unbekannt";

  const addComment = async () => {
    if (!comment.trim()) return;
    await addLog.mutateAsync({ entityType: "project", entityId: id!, message: comment.trim() });
    setComment(""); toast.success("Eintrag hinzugefügt");
  };

  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-2 gap-1.5 text-muted-foreground" onClick={() => navigate("/projekte")}>
        <ArrowLeft className="h-4 w-4" /> Zurück
      </Button>

      {/* Kopf */}
      <Card className="mb-4 flex flex-wrap items-start justify-between gap-4 p-5">
        <div>
          <div className="flex items-center gap-2">
            <Badge style={{ backgroundColor: project.project_types?.color ?? "#6b7280", color: "#fff" }}>{projId}</Badge>
            <h1 className="text-xl font-light">{project.name || project.project_types?.name}</h1>
          </div>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><User className="h-4 w-4" />{cust}</span>
            {(project.address_street || project.address_city) && (
              <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{[project.address_street, project.address_zip, project.address_city].filter(Boolean).join(", ")}</span>
            )}
            {project.current_step?.name && <Badge variant="secondary">{project.current_step.name}</Badge>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="secondary" className="gap-1.5"><GitBranch className="h-4 w-4" /> Status ändern</Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-72 overflow-y-auto">
              {steps.map((s) => (
                <DropdownMenuItem key={s.id} onClick={() => move.mutate({ projectId: project.id, stepId: s.id, stepName: s.name })}>{s.name}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button className="gap-1.5" onClick={() => navigate(`/dokumente/neu?project=${project.id}${project.customer_id ? `&customer=${project.customer_id}` : ""}`)}>
            <FilePlus className="h-4 w-4" /> Dokument erstellen
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[200px_1fr]">
        {/* vertikale Reiter */}
        <Card className="h-fit p-2">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.v} onClick={() => setTab(t.v)}
                className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm ${tab === t.v ? "bg-secondary font-medium" : "hover:bg-muted"}`}>
                <Icon className="h-4 w-4" /> {t.l}
              </button>
            );
          })}
        </Card>

        <Card className="p-5">
          {tab === "logbuch" && (
            <div>
              <div className="mb-4 flex gap-2">
                <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Neuen Logbucheintrag schreiben…" onKeyDown={(e) => e.key === "Enter" && addComment()} />
                <Button onClick={addComment} className="gap-1.5"><MessageSquarePlus className="h-4 w-4" /> Eintrag</Button>
              </div>
              {log.length === 0 ? <p className="text-sm text-muted-foreground">Noch keine Einträge.</p> : (
                <div className="space-y-3">
                  {log.map((l) => (
                    <div key={l.id} className="border-l-2 border-primary pl-3 text-sm">
                      <div className="text-xs text-link">{fmtDateTime(l.created_at)} · {l.type}</div>
                      <div className="font-medium">{l.title}</div>
                      {l.message && <div className="text-muted-foreground">{l.message}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "dokumente" && (
            documents.length === 0 ? <p className="text-sm text-muted-foreground">Noch keine Dokumente. Über „Dokument erstellen" anlegen.</p> : (
              <div className="divide-y">
                {documents.map((d) => (
                  <div key={d.id} className="flex items-center justify-between py-2 text-sm cursor-pointer hover:bg-muted/40 px-2 -mx-2 rounded" onClick={() => navigate(`/dokumente/${d.id}`)}>
                    <span><span className="text-link">{d.number ?? "Entwurf"}</span> · {docLabel(d.base_type)} <Badge variant="secondary" className="ml-1">{d.status}</Badge></span>
                    <span className="text-muted-foreground">{fmtDate(d.doc_date)} · {fmtEUR(Number(d.gross_amount))}</span>
                  </div>
                ))}
              </div>
            )
          )}

          {tab === "aufgaben" && (
            tasks.length === 0 ? <p className="text-sm text-muted-foreground">Keine Aufgaben zu diesem Projekt.</p> : (
              <div className="divide-y">
                {tasks.map((t) => {
                  const overdue = !t.done_at && t.due_date && new Date(`${t.due_date}T12:00:00`).getTime() < Date.now();
                  return (
                    <div key={t.id} className="flex items-center justify-between py-2 text-sm">
                      <span className="flex items-center gap-2">
                        <CheckSquare className={`h-4 w-4 ${t.done_at ? "text-success" : "text-muted-foreground"}`} />
                        {t.title}
                      </span>
                      <span className={overdue ? "text-destructive" : "text-muted-foreground"}>
                        {t.done_at ? "erledigt" : t.due_date ? fmtDate(t.due_date) : "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {tab === "termine" && (
            termine.length === 0 ? <p className="text-sm text-muted-foreground">Keine Termine zu diesem Projekt.</p> : (
              <div className="divide-y">
                {termine.map((a) => (
                  <div key={a.id} className="flex items-center justify-between py-2 text-sm">
                    <span>{a.title}</span>
                    <span className="text-muted-foreground">{fmtDateTime(a.start_at)}</span>
                  </div>
                ))}
              </div>
            )
          )}

          {tab === "beteiligte" && (
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between border-b py-2">
                <span className="text-muted-foreground">Kunde</span>
                <span className="font-medium">{cust}</span>
              </div>
              <div className="flex items-center justify-between border-b py-2">
                <span className="text-muted-foreground">Gewerk</span>
                <span className="font-medium">{project.project_types?.name ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Phase</span>
                <span className="font-medium">{project.current_step?.name ?? "—"}</span>
              </div>
            </div>
          )}

          {tab === "bilder" && (
            <div>
              <label className="mb-3 inline-flex cursor-pointer items-center gap-1.5 rounded-md border bg-secondary px-3 py-1.5 text-sm">
                <Upload className="h-4 w-4" /> Bild hochladen
                <input type="file" accept="image/*" className="hidden" onChange={uploadBild} />
              </label>
              {bilder.length === 0 ? <p className="text-sm text-muted-foreground">Noch keine Bilder.</p> : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                  {bilder.map((b) => (
                    <a key={b.name} href={b.url} target="_blank" rel="noreferrer" className="block aspect-square overflow-hidden rounded-md border">
                      <img src={b.url} alt={b.name} className="h-full w-full object-cover" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "zeitlohn" && (
            zeiten.length === 0 ? <p className="text-sm text-muted-foreground">Keine erfassten Zeiten.</p> : (
              <div>
                <div className="mb-2 text-sm text-muted-foreground">Summe: <span className="font-medium text-foreground">{fmtNumber(istStunden, 1)} h</span> · Lohnkosten ca. {fmtEUR(istLohn)}</div>
                <div className="divide-y">
                  {zeiten.map((z) => {
                    const emp = z.employee as { first_name?: string; last_name?: string } | null;
                    const cat = z.category as { name?: string } | null;
                    const h = (Number(z.duration_minutes ?? 0) - Number(z.break_minutes ?? 0)) / 60;
                    return (
                      <div key={z.id} className="flex items-center justify-between py-2 text-sm">
                        <span>{fmtDate(z.entry_date)} · {[emp?.first_name, emp?.last_name].filter(Boolean).join(" ") || "—"}{cat?.name ? ` · ${cat.name}` : ""}</span>
                        <span className="text-muted-foreground">{fmtNumber(h, 2)} h</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          )}

          {tab === "material" && (
            belege.length === 0 ? <p className="text-sm text-muted-foreground">Keine Materialbelege.</p> : (
              <div className="divide-y">
                {belege.map((b) => (
                  <div key={b.id} className="flex items-center justify-between py-2 text-sm">
                    <span>{b.receipt_number ?? "Beleg"}{b.category ? ` · ${b.category}` : ""}</span>
                    <span className="text-muted-foreground">{fmtDate(b.doc_date)} · {fmtEUR(Number(b.gross_amount))}</span>
                  </div>
                ))}
              </div>
            )
          )}

          {tab === "sollist" && (
            <div className="space-y-2 text-sm">
              <p className="mb-2 text-muted-foreground">Nachkalkulation: kalkuliertes Volumen gegen tatsächliche Kosten.</p>
              <div className="flex items-center justify-between border-b py-2"><span className="text-muted-foreground">Auftragsvolumen (Soll)</span><span className="font-medium">{fmtEUR(Number(project.value))}</span></div>
              <div className="flex items-center justify-between border-b py-2"><span className="text-muted-foreground">Ist Material (Belege)</span><span>{fmtEUR(istMaterial)}</span></div>
              <div className="flex items-center justify-between border-b py-2"><span className="text-muted-foreground">Ist Lohn ({fmtNumber(istStunden, 1)} h × 35 €)</span><span>{fmtEUR(istLohn)}</span></div>
              <div className="flex items-center justify-between border-b py-2"><span className="text-muted-foreground">Ist Kosten gesamt</span><span className="font-medium">{fmtEUR(istMaterial + istLohn)}</span></div>
              <div className="flex items-center justify-between py-2 text-base font-semibold"><span>Deckungsbeitrag</span><span className={Number(project.value) - istMaterial - istLohn >= 0 ? "text-success" : "text-destructive"}>{fmtEUR(Number(project.value) - istMaterial - istLohn)}</span></div>
            </div>
          )}

          {tab === "checklisten" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="secondary" className="gap-1.5" onClick={() => addChecklist()}><Plus className="h-4 w-4" /> Leere Checkliste</Button>
                {clTemplates.map((tpl) => (
                  <Button key={tpl.id} size="sm" variant="outline" onClick={() => addChecklist(tpl)}>{tpl.name}</Button>
                ))}
              </div>
              {checklists.length === 0 ? <p className="text-sm text-muted-foreground">Keine Checklisten. Lege eine an (leer oder aus Vorlage).</p> : (
                <div className="space-y-4">
                  {checklists.map((cl) => {
                    const items = itemsOf(cl);
                    const done = items.filter((i) => i.done).length;
                    return (
                      <div key={cl.id} className="rounded-md border p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="font-medium">{cl.name} <span className="text-xs text-muted-foreground">({done}/{items.length})</span></span>
                          <button onClick={async () => { await delChecklist.mutateAsync(cl.id); toast.success("Checkliste gelöscht"); }}><Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" /></button>
                        </div>
                        <div className="space-y-1.5">
                          {items.map((it, idx) => (
                            <label key={idx} className="flex items-center gap-2 text-sm">
                              <Checkbox checked={it.done} onCheckedChange={() => toggleItem(cl, idx)} />
                              <span className={it.done ? "text-muted-foreground line-through" : ""}>{it.text}</span>
                            </label>
                          ))}
                        </div>
                        <div className="mt-2 flex gap-2">
                          <Input value={newItemText[cl.id] ?? ""} placeholder="Punkt hinzufügen…" className="h-8"
                            onChange={(e) => setNewItemText((s) => ({ ...s, [cl.id]: e.target.value }))}
                            onKeyDown={(e) => e.key === "Enter" && addItem(cl)} />
                          <Button size="sm" variant="secondary" onClick={() => addItem(cl)}>+</Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
