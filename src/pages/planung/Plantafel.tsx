import { useMemo, useState } from "react";
import {
  startOfWeek, endOfWeek, addDays, addWeeks, subWeeks, isSameDay, format,
} from "date-fns";
import { de } from "date-fns/locale";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useAppointments, useAppointmentCategories, useResources, type Appointment,
} from "@/hooks/queries/usePlanning";
import { AppointmentDialog } from "@/pages/planung/Termine";
import { Plus } from "lucide-react";

export default function Plantafel() {
  const [cursor, setCursor] = useState(() => new Date());
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Appointment | null>(null);
  const [defaults, setDefaults] = useState<Partial<Appointment> | undefined>();

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

  const colorFor = (id: string | null) =>
    categories.find((c) => c.id === id)?.color ?? "#64748b";

  const cellItems = (resourceId: string, day: Date) =>
    appointments.filter(
      (a) => a.resource_id === resourceId && isSameDay(new Date(a.start_at), day),
    );

  const openNew = (resourceId?: string, day?: Date) => {
    const d: Partial<Appointment> = {};
    if (resourceId) d.resource_id = resourceId;
    if (day) {
      const start = new Date(day);
      start.setHours(8, 0, 0, 0);
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      d.start_at = start.toISOString();
      d.end_at = end.toISOString();
    }
    setDefaults(d);
    setEdit(null);
    setOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Plantafel"
        subtitle="Ressourcenplanung der Woche"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCursor((c) => subWeeks(c, 1))}>‹</Button>
            <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>Heute</Button>
            <Button variant="outline" size="sm" onClick={() => setCursor((c) => addWeeks(c, 1))}>›</Button>
            <span className="ml-2 text-sm font-medium">
              {format(weekStart, "dd.MM.")} – {format(addDays(weekStart, 5), "dd.MM.yyyy")}
            </span>
            <Button onClick={() => openNew()} className="ml-2 gap-1.5">
              <Plus className="h-4 w-4" /> Neuer Termin
            </Button>
          </div>
        }
      />

      <div className="overflow-x-auto rounded-md border bg-card">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-muted/50">
              <th className="w-44 border-b border-r px-3 py-2 text-left font-medium">Ressource</th>
              {days.map((d) => (
                <th key={d.toISOString()} className="border-b border-r px-2 py-2 text-center font-medium">
                  <div className="capitalize">{format(d, "EEE", { locale: de })}</div>
                  <div className="text-[11px] text-muted-foreground">{format(d, "dd.MM.")}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {resources.length === 0 ? (
              <tr>
                <td colSpan={days.length + 1} className="px-3 py-8 text-center text-muted-foreground">
                  Keine Ressourcen angelegt. Lege Ressourcen unter Einstellungen an.
                </td>
              </tr>
            ) : (
              resources.map((res) => (
                <tr key={res.id}>
                  <td className="border-b border-r px-3 py-2 align-top font-medium">{res.name}</td>
                  {days.map((d) => {
                    const items = cellItems(res.id, d);
                    return (
                      <td
                        key={d.toISOString()}
                        className="group min-w-[120px] cursor-pointer border-b border-r p-1 align-top hover:bg-muted/30"
                        onClick={() => openNew(res.id, d)}
                      >
                        <div className="min-h-[44px] space-y-1">
                          {items.map((a) => (
                            <button
                              key={a.id}
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setDefaults(undefined); setEdit(a); setOpen(true); }}
                              className={cn(
                                "block w-full truncate rounded px-1.5 py-1 text-left text-[11px] text-white",
                              )}
                              style={{ backgroundColor: colorFor(a.category_id) }}
                              title={a.title}
                            >
                              {format(new Date(a.start_at), "HH:mm")} {a.title}
                            </button>
                          ))}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AppointmentDialog open={open} onOpenChange={setOpen} appointment={edit} defaults={defaults} />
    </div>
  );
}
