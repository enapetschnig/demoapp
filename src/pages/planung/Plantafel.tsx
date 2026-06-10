import { useMemo, useState, type ReactNode } from "react";
import {
  startOfWeek, endOfWeek, addDays, addWeeks, subWeeks, isSameDay, format, getISOWeek,
} from "date-fns";
import { de } from "date-fns/locale";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuCheckboxItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  useAppointments, useAppointmentCategories, useResources, useUpsertAppointment,
  type Appointment,
} from "@/hooks/queries/usePlanning";
import { useProjects, useProjectTypes } from "@/hooks/queries/useProjects";
import { AppointmentDialog } from "@/pages/planung/Termine";
import { toast } from "sonner";
import { Plus, Filter } from "lucide-react";

// Stundenblöcke der Tagesachse (06/09/12/15 Uhr).
const BLOCKS = [6, 9, 12, 15] as const;

// start_at-Stunde auf den passenden Block abrunden (06/09/12/15).
const blockForHour = (hour: number): number => {
  let b: number = BLOCKS[0];
  for (const h of BLOCKS) if (hour >= h) b = h;
  return b;
};

// Tag + Blockstunde -> ISO-Start, +1h -> ISO-Ende.
function slotTimes(day: Date, blockHour: number): { start_at: string; end_at: string } {
  const start = new Date(day);
  start.setHours(blockHour, 0, 0, 0);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return { start_at: start.toISOString(), end_at: end.toISOString() };
}

export default function Plantafel() {
  const [cursor, setCursor] = useState(() => new Date());
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Appointment | null>(null);
  const [defaults, setDefaults] = useState<Partial<Appointment> | undefined>();
  const [dragId, setDragId] = useState<string | null>(null);
  const [catFilter, setCatFilter] = useState<Set<string>>(new Set());
  const [gewerkFilter, setGewerkFilter] = useState<Set<string>>(new Set());

  const weekStart = useMemo(() => startOfWeek(cursor, { weekStartsOn: 1 }), [cursor]);
  const range = useMemo(
    () => ({ from: weekStart, to: endOfWeek(cursor, { weekStartsOn: 1 }) }),
    [cursor, weekStart],
  );

  // Mo–Sa
  const days = useMemo(
    () => Array.from({ length: 6 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const { data: appointments = [] } = useAppointments(range);
  const { data: categories = [] } = useAppointmentCategories();
  const { data: resources = [] } = useResources();
  const { data: projects = [] } = useProjects();
  const { data: projectTypes = [] } = useProjectTypes();
  const upsert = useUpsertAppointment();

  const colorFor = (id: string | null) =>
    categories.find((c) => c.id === id)?.color ?? "#64748b";

  // Termine nach Kategorie- und Gewerk-Filter (über appointment.project_id -> project_type_id) einschränken.
  const filtered = useMemo(() => {
    return appointments.filter((a) => {
      if (catFilter.size > 0 && !(a.category_id && catFilter.has(a.category_id))) return false;
      if (gewerkFilter.size > 0) {
        const g = projects.find((p) => p.id === a.project_id)?.project_type_id ?? null;
        if (!g || !gewerkFilter.has(g)) return false;
      }
      return true;
    });
  }, [appointments, catFilter, gewerkFilter, projects]);

  // Ressourcen in "Allgemein" und "Mitarbeiter" gruppieren (resources.type).
  const groups = useMemo(() => {
    const mitarbeiter = resources.filter((r) => (r.type ?? "").toLowerCase() === "mitarbeiter");
    const allgemein = resources.filter((r) => (r.type ?? "").toLowerCase() !== "mitarbeiter");
    return [
      { label: "Allgemein", items: allgemein },
      { label: "Mitarbeiter", items: mitarbeiter },
    ].filter((g) => g.items.length > 0);
  }, [resources]);

  const cellItems = (resourceId: string, day: Date, blockHour: number) =>
    filtered.filter(
      (a) =>
        a.resource_id === resourceId &&
        isSameDay(new Date(a.start_at), day) &&
        blockForHour(new Date(a.start_at).getHours()) === blockHour,
    );

  const openNew = (resourceId: string, day: Date, blockHour: number) => {
    const { start_at, end_at } = slotTimes(day, blockHour);
    setDefaults({ resource_id: resourceId, start_at, end_at });
    setEdit(null);
    setOpen(true);
  };

  const openEdit = (a: Appointment) => {
    setDefaults(undefined);
    setEdit(a);
    setOpen(true);
  };

  // Drop: Termin in andere Zelle ziehen -> neuer resource_id + Tag/Blockstunde.
  const onDrop = async (resourceId: string, day: Date, blockHour: number) => {
    const a = appointments.find((x) => x.id === dragId);
    setDragId(null);
    if (!a) return;
    const { start_at, end_at } = slotTimes(day, blockHour);
    if (a.resource_id === resourceId && a.start_at === start_at) return;
    try {
      await upsert.mutateAsync({ id: a.id, resource_id: resourceId, start_at, end_at });
      toast.success("Termin verschoben");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const label = `${format(weekStart, "d.", { locale: de })} – ${format(addDays(weekStart, 5), "d. MMMM yyyy", { locale: de })} KW${getISOWeek(weekStart)}`;

  return (
    <div>
      <PageHeader
        title="Plantafel"
        subtitle="Ressourcenplanung der Woche"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCursor((c) => subWeeks(c, 1))}>‹</Button>
            <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>Heute</Button>
            <Button variant="outline" size="sm" onClick={() => setCursor((c) => addWeeks(c, 1))}>›</Button>
            <span className="ml-1 text-sm font-medium">{label}</span>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="ml-1 gap-1.5">
                  <Filter className="h-3.5 w-3.5" /> Kategorie
                  {catFilter.size > 0 && <span className="text-xs text-muted-foreground">({catFilter.size})</span>}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>Kategorie</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {categories.length === 0 ? (
                  <DropdownMenuLabel className="font-normal text-muted-foreground">Keine Kategorien</DropdownMenuLabel>
                ) : (
                  categories.map((c) => (
                    <DropdownMenuCheckboxItem
                      key={c.id}
                      checked={catFilter.has(c.id)}
                      onCheckedChange={(v) =>
                        setCatFilter((prev) => {
                          const next = new Set(prev);
                          if (v) next.add(c.id); else next.delete(c.id);
                          return next;
                        })
                      }
                      onSelect={(e) => e.preventDefault()}
                    >
                      {c.name}
                    </DropdownMenuCheckboxItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Filter className="h-3.5 w-3.5" /> Gewerk
                  {gewerkFilter.size > 0 && <span className="text-xs text-muted-foreground">({gewerkFilter.size})</span>}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>Gewerk</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {projectTypes.length === 0 ? (
                  <DropdownMenuLabel className="font-normal text-muted-foreground">Keine Gewerke</DropdownMenuLabel>
                ) : (
                  projectTypes.map((t) => (
                    <DropdownMenuCheckboxItem
                      key={t.id}
                      checked={gewerkFilter.has(t.id)}
                      onCheckedChange={(v) =>
                        setGewerkFilter((prev) => {
                          const next = new Set(prev);
                          if (v) next.add(t.id); else next.delete(t.id);
                          return next;
                        })
                      }
                      onSelect={(e) => e.preventDefault()}
                    >
                      {t.name}
                    </DropdownMenuCheckboxItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              onClick={() => openNew(resources[0]?.id ?? "", days[0], BLOCKS[1])}
              disabled={resources.length === 0}
              className="ml-1 gap-1.5"
            >
              <Plus className="h-4 w-4" /> Neuer Termin
            </Button>
          </div>
        }
      />

      <div className="overflow-x-auto rounded-md border bg-card">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-muted/50">
              <th rowSpan={2} className="w-44 border-b border-r px-3 py-2 text-left align-bottom font-medium">
                Ressourcen
              </th>
              {days.map((d) => (
                <th
                  key={d.toISOString()}
                  colSpan={BLOCKS.length}
                  className={cn(
                    "border-b border-r px-2 py-1.5 text-center font-medium",
                    isSameDay(d, new Date()) && "bg-primary/10",
                  )}
                >
                  <span className="capitalize">{format(d, "EEEE", { locale: de })}</span>{" "}
                  <span className="text-[11px] text-muted-foreground">{format(d, "dd.MM.")}</span>
                </th>
              ))}
            </tr>
            <tr className="bg-muted/30">
              {days.map((d) =>
                BLOCKS.map((h) => (
                  <th
                    key={`${d.toISOString()}-${h}`}
                    className="w-16 border-b border-r px-1 py-1 text-center text-[10px] font-normal text-muted-foreground"
                  >
                    {String(h).padStart(2, "0")}
                  </th>
                )),
              )}
            </tr>
          </thead>
          <tbody>
            {resources.length === 0 ? (
              <tr>
                <td colSpan={days.length * BLOCKS.length + 1} className="px-3 py-8 text-center text-muted-foreground">
                  Keine Ressourcen angelegt. Lege Ressourcen unter Planung &gt; Einstellungen an.
                </td>
              </tr>
            ) : (
              groups.map((group) => (
                <FragmentGroup key={group.label}>
                  <tr className="bg-muted/40">
                    <td colSpan={days.length * BLOCKS.length + 1} className="border-b px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {group.label}
                    </td>
                  </tr>
                  {group.items.map((res) => (
                    <tr key={res.id}>
                      <td className="border-b border-r px-3 py-2 align-top font-medium">{res.name}</td>
                      {days.map((d) =>
                        BLOCKS.map((h) => {
                          const items = cellItems(res.id, d, h);
                          return (
                            <td
                              key={`${res.id}-${d.toISOString()}-${h}`}
                              className={cn(
                                "min-w-[64px] cursor-pointer border-b border-r p-0.5 align-top hover:bg-muted/30",
                                dragId && "outline-dashed outline-1 outline-transparent hover:outline-primary/50",
                              )}
                              onClick={() => openNew(res.id, d, h)}
                              onDragOver={(e) => { if (dragId) e.preventDefault(); }}
                              onDrop={(e) => { e.preventDefault(); onDrop(res.id, d, h); }}
                            >
                              <div className="min-h-[40px] space-y-0.5">
                                {items.map((a) => (
                                  <button
                                    key={a.id}
                                    type="button"
                                    draggable
                                    onDragStart={() => setDragId(a.id)}
                                    onDragEnd={() => setDragId(null)}
                                    onClick={(e) => { e.stopPropagation(); openEdit(a); }}
                                    className="block w-full cursor-grab truncate rounded px-1.5 py-1 text-left text-[11px] text-white active:cursor-grabbing"
                                    style={{ backgroundColor: colorFor(a.category_id) }}
                                    title={`${format(new Date(a.start_at), "HH:mm")} ${a.title}`}
                                  >
                                    {format(new Date(a.start_at), "HH:mm")} {a.title}
                                  </button>
                                ))}
                              </div>
                            </td>
                          );
                        }),
                      )}
                    </tr>
                  ))}
                </FragmentGroup>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AppointmentDialog open={open} onOpenChange={setOpen} appointment={edit} defaults={defaults} />
    </div>
  );
}

// Hilfs-Fragment, damit Gruppen-Header und Zeilen ohne zusätzlichen DOM-Knoten gerendert werden.
function FragmentGroup({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
