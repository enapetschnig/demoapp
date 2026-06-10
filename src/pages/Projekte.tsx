import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { CreateProjectDialog } from "@/components/CreateProjectDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fmtEUR } from "@/lib/format";
import { useProjects, useProjectTypes, useMoveProjectStep, type ProjectRow } from "@/hooks/queries/useProjects";
import { Plus, LayoutList, Trello } from "lucide-react";

const custName = (p: ProjectRow) =>
  [p.customer?.first_name, p.customer?.last_name].filter(Boolean).join(" ") || p.customer?.company_name || "—";
const projId = (p: ProjectRow) => `${p.project_types?.code ?? "PRJ"}-${p.project_number}`;

export default function Projekte({ autoNew }: { autoNew?: boolean }) {
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const typeFilter = sp.get("type");
  const stepFilter = sp.get("step");
  const overdue = sp.get("filter") === "ueberfaellig";
  const { data: allProjects = [], isLoading } = useProjects();
  const { data: types = [] } = useProjectTypes();
  const move = useMoveProjectStep();
  const [view, setView] = useState<"liste" | "pipeline">("liste");
  const [dialog, setDialog] = useState(false);
  const [kanbanType, setKanbanType] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);

  useEffect(() => { if (autoNew) setDialog(true); }, [autoNew]);
  useEffect(() => {
    if (typeFilter) setKanbanType(typeFilter);
    else if (!kanbanType && types.length) setKanbanType(types.find((t) => t.is_standard)?.id ?? types[0].id);
  }, [types, kanbanType, typeFilter]);

  // Sidebar-Filter (Gewerk / Phase / überfällig) anwenden
  const projects = useMemo(() => {
    const now = Date.now();
    return allProjects.filter((p) => {
      if (typeFilter && p.project_type_id !== typeFilter) return false;
      if (stepFilter && p.current_step_id !== stepFilter) return false;
      if (overdue && !(p.reminder_at && new Date(p.reminder_at).getTime() < now)) return false;
      return true;
    });
  }, [allProjects, typeFilter, stepFilter, overdue]);

  const activeTypeName = types.find((t) => t.id === typeFilter)?.name;

  const columns: Column<ProjectRow>[] = [
    { key: "gewerk", header: "Gewerk", sortable: false, render: (p) => (
      <Badge style={{ backgroundColor: p.project_types?.color ?? "#6b7280", color: "#fff" }}>{p.project_types?.code ?? "PRJ"}</Badge>
    ) },
    { key: "id", header: "Projekt-ID", accessor: (p) => p.project_number, render: (p) => <span className="text-link">{projId(p)}</span> },
    { key: "kunde", header: "Kunde", accessor: (p) => custName(p), filterable: true, render: custName },
    { key: "name", header: "Projektname", filterable: true },
    { key: "address_city", header: "Projektanschrift", filterable: true, render: (p) => [p.address_street, p.address_city].filter(Boolean).join(", ") },
    { key: "phase", header: "Phase", accessor: (p) => p.current_step?.name, render: (p) => p.current_step?.name ?? "—" },
    { key: "source", header: "Quelle", accessor: (p) => p.source?.name, render: (p) => p.source?.name ?? "—" },
    { key: "value", header: "Projektwert", className: "text-right", render: (p) => fmtEUR(Number(p.value)) },
  ];

  const activeType = types.find((t) => t.id === kanbanType);
  const steps = useMemo(() => activeType?.steps ?? [], [activeType]);
  const kanbanProjects = projects.filter((p) => p.project_type_id === kanbanType);

  return (
    <div>
      <PageHeader
        title={activeTypeName ?? "Projekte"}
        subtitle={overdue ? "Überfällige Projekte" : activeTypeName ? "Verwaltung der Firmenprojekte" : "Verwaltung der Firmenprojekte"}
        actions={
          <>
            <div className="flex overflow-hidden rounded-md border">
              <button className={`flex items-center gap-1.5 px-3 py-1.5 text-sm ${view === "liste" ? "bg-secondary" : "bg-card"}`} onClick={() => setView("liste")}><LayoutList className="h-4 w-4" /> Liste</button>
              <button className={`flex items-center gap-1.5 px-3 py-1.5 text-sm ${view === "pipeline" ? "bg-secondary" : "bg-card"}`} onClick={() => setView("pipeline")}><Trello className="h-4 w-4" /> Pipeline</button>
            </div>
            <Button onClick={() => setDialog(true)} className="gap-1.5"><Plus className="h-4 w-4" /> Projekt</Button>
          </>
        }
      />

      {view === "liste" ? (
        <DataTable data={projects} columns={columns} loading={isLoading} getRowId={(p) => p.id} onRowClick={(p) => navigate(`/projekte/${p.id}`)} />
      ) : (
        <div>
          <div className="mb-4 w-64">
            <Select value={kanbanType} onValueChange={setKanbanType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{types.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-4">
            {steps.map((step) => {
              const cards = kanbanProjects.filter((p) => p.current_step_id === step.id);
              return (
                <div
                  key={step.id}
                  className="w-64 shrink-0"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => { if (dragId) { move.mutate({ projectId: dragId, stepId: step.id, stepName: step.name }); setDragId(null); } }}
                >
                  <div className="mb-2 flex items-center justify-between px-1 text-sm font-medium">
                    <span className="truncate">{step.name}</span>
                    <Badge variant="secondary">{cards.length}</Badge>
                  </div>
                  <div className="flex min-h-[120px] flex-col gap-2 rounded-md bg-muted/40 p-2">
                    {cards.map((p) => (
                      <Card
                        key={p.id}
                        draggable
                        onDragStart={() => setDragId(p.id)}
                        onClick={() => navigate(`/projekte/${p.id}`)}
                        className="cursor-pointer p-3 text-sm shadow-sm hover:shadow"
                      >
                        <div className="font-medium text-link">{projId(p)}</div>
                        <div className="truncate text-muted-foreground">{custName(p)}</div>
                        {p.name && <div className="truncate text-xs">{p.name}</div>}
                        {Number(p.value) > 0 && <div className="mt-1 text-xs font-medium">{fmtEUR(Number(p.value))}</div>}
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <CreateProjectDialog open={dialog} onOpenChange={setDialog} />
    </div>
  );
}
