import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProject, useProjectTypes, useMoveProjectStep, useActivityLog, useAddLogEntry } from "@/hooks/queries/useProjects";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { fmtEUR, fmtDate, fmtDateTime } from "@/lib/format";
import { docLabel } from "@/lib/documentTypes";
import { toast } from "sonner";
import { ArrowLeft, MapPin, User, FilePlus, GitBranch, ListChecks, FileText, MessageSquarePlus, CheckSquare, CalendarDays, Users } from "lucide-react";

const TABS = [
  { v: "logbuch", l: "Logbuch", icon: ListChecks },
  { v: "dokumente", l: "Dokumente", icon: FileText },
  { v: "aufgaben", l: "Aufgaben", icon: CheckSquare },
  { v: "termine", l: "Termine", icon: CalendarDays },
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
        </Card>
      </div>
    </div>
  );
}
