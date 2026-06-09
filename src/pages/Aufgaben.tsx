import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { fmtDate, toISODate } from "@/lib/format";
import { useAuth } from "@/contexts/AuthContext";
import {
  useTasks, useUpsertTask, useToggleTaskDone, useTaskProfiles, useTaskProjects,
  type Task, type Profile, type Project,
} from "@/hooks/queries/useTasks";
import { Plus } from "lucide-react";

const NONE = "__none__";

const profileLabel = (p: Profile): string => {
  const name = [p.first_name, p.last_name].filter(Boolean).join(" ").trim();
  return name || p.email || "Unbenannt";
};

const projectLabel = (p: Project): string => {
  const name = p.name?.trim();
  return name ? `${p.project_number} – ${name}` : `Projekt ${p.project_number}`;
};

function TaskDialog({
  open, onOpenChange, task, profiles, projects,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  task?: Task | null;
  profiles: Profile[];
  projects: Project[];
}) {
  const upsert = useUpsertTask();
  const [f, setF] = useState<Partial<Task>>({});

  useEffect(() => {
    if (open) setF(task ?? { title: "", description: "", due_date: toISODate() });
  }, [open, task]);

  const set = (k: keyof Task, v: unknown) => setF((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!f.title?.trim()) return toast.error("Bitte einen Titel angeben.");
    try {
      await upsert.mutateAsync(f);
      toast.success("Aufgabe gespeichert");
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{task ? "Aufgabe bearbeiten" : "Aufgabe erstellen"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 pt-1">
          <div className="col-span-2 space-y-1.5">
            <Label>Titel</Label>
            <Input value={f.title ?? ""} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Beschreibung</Label>
            <Textarea rows={3} value={f.description ?? ""} onChange={(e) => set("description", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Zugewiesen an</Label>
            <Select
              value={f.assigned_to ?? NONE}
              onValueChange={(v) => set("assigned_to", v === NONE ? null : v)}
            >
              <SelectTrigger><SelectValue placeholder="Niemand" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Niemand</SelectItem>
                {profiles.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{profileLabel(p)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Projekt</Label>
            <Select
              value={f.project_id ?? NONE}
              onValueChange={(v) => set("project_id", v === NONE ? null : v)}
            >
              <SelectTrigger><SelectValue placeholder="Kein Projekt" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Kein Projekt</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{projectLabel(p)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Erledigen bis</Label>
            <Input
              type="date"
              value={f.due_date ?? ""}
              onChange={(e) => set("due_date", e.target.value || null)}
            />
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

const TABS = [
  { v: "meine", l: "Meine" },
  { v: "erstellte", l: "Erstellte" },
  { v: "erledigte", l: "Erledigte" },
  { v: "alle", l: "Alle" },
];

export default function Aufgaben() {
  const { profile } = useAuth();
  const { data = [], isLoading } = useTasks();
  const { data: profiles = [] } = useTaskProfiles();
  const { data: projects = [] } = useTaskProjects();
  const toggleDone = useToggleTaskDone();

  const [tab, setTab] = useState("meine");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Task | null>(null);

  const profileName = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of profiles) m.set(p.id, profileLabel(p));
    return m;
  }, [profiles]);

  const projectName = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of projects) m.set(p.id, projectLabel(p));
    return m;
  }, [projects]);

  const rows = useMemo(() => {
    if (tab === "erledigte") return data.filter((t) => t.done_at);
    if (tab === "meine") return data.filter((t) => t.assigned_to === profile?.id && !t.done_at);
    if (tab === "erstellte") return data.filter((t) => t.created_by === profile?.id && !t.done_at);
    return data.filter((t) => !t.done_at);
  }, [data, tab, profile?.id]);

  const today = toISODate();

  const columns: Column<Task>[] = [
    {
      key: "title", header: "Aufgabe", filterable: true,
      render: (r) => (
        <div>
          <div className={r.done_at ? "text-muted-foreground line-through" : "font-medium"}>{r.title}</div>
          {r.description && (
            <div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{r.description}</div>
          )}
        </div>
      ),
    },
    {
      key: "assigned_to", header: "Zugewiesen",
      accessor: (r) => (r.assigned_to ? profileName.get(r.assigned_to) ?? "" : ""),
      render: (r) => (r.assigned_to ? profileName.get(r.assigned_to) ?? "—" : "—"),
    },
    {
      key: "project_id", header: "Projekt",
      accessor: (r) => (r.project_id ? projectName.get(r.project_id) ?? "" : ""),
      render: (r) => (r.project_id ? projectName.get(r.project_id) ?? "—" : "—"),
    },
    {
      key: "due_date", header: "Erledigen bis",
      accessor: (r) => r.due_date ?? "",
      render: (r) => {
        if (!r.due_date) return <span className="text-muted-foreground">—</span>;
        const overdue = !r.done_at && r.due_date < today;
        return <span className={overdue ? "font-medium text-destructive" : ""}>{fmtDate(r.due_date)}</span>;
      },
    },
    {
      key: "done_at", header: "Erledigt", sortable: false, width: "120px",
      render: (r) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={!!r.done_at}
            disabled={toggleDone.isPending}
            onCheckedChange={(c) => toggleDone.mutate({ id: r.id, done: !!c })}
          />
          {r.done_at
            ? <Badge variant="secondary">Erledigt</Badge>
            : <Badge variant="outline">Offen</Badge>}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Aufgaben"
        subtitle="Aufgabenverwaltung"
        actions={
          <Button onClick={() => { setEdit(null); setOpen(true); }} className="gap-1.5">
            <Plus className="h-4 w-4" /> Aufgabe
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList>
          {TABS.map((t) => <TabsTrigger key={t.v} value={t.v}>{t.l}</TabsTrigger>)}
        </TabsList>
      </Tabs>

      <DataTable
        data={rows}
        columns={columns}
        loading={isLoading}
        getRowId={(r) => r.id}
        onRowClick={(r) => { setEdit(r); setOpen(true); }}
      />

      <TaskDialog
        open={open}
        onOpenChange={setOpen}
        task={edit}
        profiles={profiles}
        projects={projects}
      />
    </div>
  );
}
