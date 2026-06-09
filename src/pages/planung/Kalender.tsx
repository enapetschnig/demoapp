import { useMemo, useState } from "react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  isSameMonth, isSameDay, addMonths, subMonths, format,
} from "date-fns";
import { de } from "date-fns/locale";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useAppointments, useAppointmentCategories, type Appointment,
} from "@/hooks/queries/usePlanning";
import { AppointmentDialog } from "@/pages/planung/Termine";

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

export default function Kalender() {
  const [cursor, setCursor] = useState(() => new Date());
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Appointment | null>(null);

  const range = useMemo(() => {
    const from = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const to = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return { from, to };
  }, [cursor]);

  const { data: appointments = [] } = useAppointments(range);
  const { data: categories = [] } = useAppointmentCategories();

  const colorFor = (id: string | null) =>
    categories.find((c) => c.id === id)?.color ?? "#64748b";

  const days = useMemo(
    () => eachDayOfInterval({ start: range.from, end: range.to }),
    [range],
  );

  const byDay = (day: Date) =>
    appointments.filter((a) => isSameDay(new Date(a.start_at), day));

  return (
    <div>
      <PageHeader
        title="Kalender"
        subtitle="Monatsansicht"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCursor((c) => subMonths(c, 1))}>‹</Button>
            <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>Heute</Button>
            <Button variant="outline" size="sm" onClick={() => setCursor((c) => addMonths(c, 1))}>›</Button>
            <span className="ml-2 text-sm font-medium capitalize">
              {format(cursor, "MMMM yyyy", { locale: de })}
            </span>
          </div>
        }
      />

      <div className="overflow-hidden rounded-md border bg-card">
        <div className="grid grid-cols-7 border-b bg-muted/50 text-xs font-medium text-muted-foreground">
          {WEEKDAYS.map((d) => (
            <div key={d} className="px-2 py-2 text-center">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const inMonth = isSameMonth(day, cursor);
            const today = isSameDay(day, new Date());
            const items = byDay(day);
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-[110px] border-b border-r p-1.5 text-xs",
                  !inMonth && "bg-muted/30 text-muted-foreground",
                )}
              >
                <div className="mb-1 flex justify-end">
                  <span
                    className={cn(
                      "inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px]",
                      today && "bg-primary font-semibold text-primary-foreground",
                    )}
                  >
                    {format(day, "d")}
                  </span>
                </div>
                <div className="space-y-1">
                  {items.slice(0, 4).map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => { setEdit(a); setOpen(true); }}
                      className="block w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] text-white"
                      style={{ backgroundColor: colorFor(a.category_id) }}
                      title={a.title}
                    >
                      {format(new Date(a.start_at), "HH:mm")} {a.title}
                    </button>
                  ))}
                  {items.length > 4 && (
                    <div className="px-1.5 text-[10px] text-muted-foreground">
                      +{items.length - 4} weitere
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <AppointmentDialog open={open} onOpenChange={setOpen} appointment={edit} />
    </div>
  );
}
