import { ReactNode, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  ComposedChart,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DataTable, type Column } from "@/components/DataTable";
import { fmtEUR, fmtNumber } from "@/lib/format";
import {
  useRevenueReport,
  useDocTypeCounts,
  useProjectReport,
  useCustomerReport,
  useTimeReport,
  useTopPositions,
  useRevenueProjectsOverview,
  periodRange,
  PERIOD_OPTIONS,
  type ReportPeriod,
  type DateRange,
  type TopPosition,
} from "@/hooks/queries/useReports";
import { BarChart3, FolderKanban, Users, Clock, Package, LineChart as LineChartIcon, Inbox, Loader2 } from "lucide-react";

const CHART_COLORS = [
  "hsl(var(--primary))",
  "#60a5fa",
  "#34d399",
  "#fbbf24",
  "#f87171",
  "#a78bfa",
  "#fb923c",
  "#22d3ee",
  "#f472b6",
  "#4ade80",
];

// --- kleine Bausteine ------------------------------------------------------

function KpiCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-light tabular-nums">{value}</div>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex h-[260px] flex-col items-center justify-center gap-2 text-muted-foreground">
      <Inbox className="h-8 w-8 opacity-50" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex h-[260px] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
};

// --- Tab: Umsätze ----------------------------------------------------------

function UmsaetzeTab({ range }: { range: DateRange }) {
  const { data: rev, isLoading: revLoading } = useRevenueReport(range);
  const { data: docTypes = [], isLoading: docLoading } = useDocTypeCounts(range);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Umsatz netto (gesamt)" value={fmtEUR(rev?.totalNet ?? 0)} />
        <KpiCard label="Umsatz brutto (gesamt)" value={fmtEUR(rev?.totalGross ?? 0)} />
        <KpiCard label="Rechnungen" value={fmtNumber(rev?.invoiceCount ?? 0, 0)} />
        <KpiCard label="Ø Rechnungswert (netto)" value={fmtEUR(rev?.avgInvoice ?? 0)} />
      </div>

      <ChartCard title="Umsatz pro Monat (netto)">
        {revLoading ? (
          <LoadingState />
        ) : !rev?.monthly.length ? (
          <EmptyState text="Noch keine Rechnungen vorhanden." />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={rev.monthly} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => fmtNumber(Number(v), 0)} width={70} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [fmtEUR(v), "Netto"]}
              />
              <Line
                type="monotone"
                dataKey="net"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 3 }}
                name="Netto"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title="Dokumente je Basistyp">
        {docLoading ? (
          <LoadingState />
        ) : !docTypes.length ? (
          <EmptyState text="Noch keine Dokumente vorhanden." />
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={docTypes} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={70} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} width={40} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [fmtNumber(v, 0), "Anzahl"]}
              />
              <Bar dataKey="count" name="Anzahl" radius={[4, 4, 0, 0]}>
                {docTypes.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}

// --- Tab: Projekte ---------------------------------------------------------

function ProjekteTab() {
  const { data: rep, isLoading } = useProjectReport();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Aktive Projekte" value={fmtNumber(rep?.total ?? 0, 0)} />
        <KpiCard label="Auftragsvolumen (gesamt)" value={fmtEUR(rep?.totalValue ?? 0)} />
        <KpiCard label="Ø Projektwert" value={fmtEUR(rep?.avgValue ?? 0)} />
      </div>

      <ChartCard title="Projekte je Gewerk (Anzahl)">
        {isLoading ? (
          <LoadingState />
        ) : !rep?.byType.length ? (
          <EmptyState text="Noch keine Projekte vorhanden." />
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={rep.byType} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={70} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} width={40} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [fmtNumber(v, 0), "Anzahl"]}
              />
              <Bar dataKey="count" name="Anzahl" radius={[4, 4, 0, 0]}>
                {rep.byType.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title="Auftragsvolumen je Gewerk">
        {isLoading ? (
          <LoadingState />
        ) : !rep?.byType.length ? (
          <EmptyState text="Noch keine Projekte vorhanden." />
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={rep.byType} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={70} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => fmtNumber(Number(v), 0)} width={70} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [fmtEUR(v), "Volumen"]}
              />
              <Bar dataKey="value" name="Volumen" radius={[4, 4, 0, 0]}>
                {rep.byType.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}

// --- Tab: Kunden -----------------------------------------------------------

function KundenTab() {
  const { data: rep, isLoading } = useCustomerReport();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Aktive Kontakte" value={fmtNumber(rep?.contactCount ?? 0, 0)} />
        <KpiCard label="Kunden" value={fmtNumber(rep?.customerCount ?? 0, 0)} />
        <KpiCard label="Verrechnete Kunden" value={fmtNumber(rep?.invoicedCustomers ?? 0, 0)} />
      </div>

      <ChartCard title="Top-Kunden nach Umsatz (brutto)">
        {isLoading ? (
          <LoadingState />
        ) : !rep?.top.length ? (
          <EmptyState text="Noch keine verrechneten Kunden vorhanden." />
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(280, rep.top.length * 38)}>
            <BarChart
              data={rep.top}
              layout="vertical"
              margin={{ top: 8, right: 24, left: 8, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v) => fmtNumber(Number(v), 0)} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={150} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [fmtEUR(v), "Brutto"]}
              />
              <Bar dataKey="gross" name="Brutto" radius={[0, 4, 4, 0]}>
                {rep.top.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}

// --- Tab: Mitarbeitende ----------------------------------------------------

function MitarbeitendeTab() {
  const { data: rep, isLoading } = useTimeReport();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Erfasste Stunden (gesamt)" value={`${fmtNumber(rep?.totalHours ?? 0, 1)} h`} />
        <KpiCard label="Zeiteinträge" value={fmtNumber(rep?.entryCount ?? 0, 0)} />
        <KpiCard label="Mitarbeitende mit Zeiten" value={fmtNumber(rep?.byEmployee.length ?? 0, 0)} />
      </div>

      <ChartCard title="Stunden je Mitarbeiter:in">
        {isLoading ? (
          <LoadingState />
        ) : !rep?.byEmployee.length ? (
          <EmptyState text="Noch keine Zeiterfassung vorhanden." />
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(280, rep.byEmployee.length * 40)}>
            <BarChart
              data={rep.byEmployee}
              layout="vertical"
              margin={{ top: 8, right: 24, left: 8, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v) => fmtNumber(Number(v), 0)} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={150} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [`${fmtNumber(v, 1)} h`, "Stunden"]}
              />
              <Bar dataKey="hours" name="Stunden" radius={[0, 4, 4, 0]}>
                {rep.byEmployee.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title="Stunden je Kategorie">
        {isLoading ? (
          <LoadingState />
        ) : !rep?.byCategory.length ? (
          <EmptyState text="Noch keine Zeiterfassung vorhanden." />
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={rep.byCategory} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={70} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => fmtNumber(Number(v), 0)} width={50} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [`${fmtNumber(v, 1)} h`, "Stunden"]}
              />
              <Bar dataKey="hours" name="Stunden" radius={[4, 4, 0, 0]}>
                {rep.byCategory.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}

// --- Tab: Artikel & Leistungen ---------------------------------------------

const positionColumns: Column<TopPosition>[] = [
  { key: "name", header: "Name", sortable: true, filterable: true },
  {
    key: "quantity",
    header: "Menge",
    sortable: true,
    className: "text-right tabular-nums",
    accessor: (r) => r.quantity,
    render: (r) => fmtNumber(r.quantity, 2),
  },
  {
    key: "net",
    header: "Umsatz (netto)",
    sortable: true,
    className: "text-right tabular-nums",
    accessor: (r) => r.net,
    render: (r) => fmtEUR(r.net),
  },
];

function ArtikelTab() {
  const { data: positions = [], isLoading } = useTopPositions(10);

  return (
    <div className="space-y-6">
      <ChartCard title="Top-10 meistverwendete Positionen (nach Menge)">
        {isLoading ? (
          <LoadingState />
        ) : !positions.length ? (
          <EmptyState text="Noch keine Positionen in zahlbaren Dokumenten vorhanden." />
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(280, positions.length * 40)}>
            <BarChart
              data={positions}
              layout="vertical"
              margin={{ top: 8, right: 24, left: 8, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v) => fmtNumber(Number(v), 0)} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={180} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [fmtNumber(v, 2), "Menge"]}
              />
              <Bar dataKey="quantity" name="Menge" radius={[0, 4, 4, 0]}>
                {positions.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Positionen im Detail</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={positions}
            columns={positionColumns}
            loading={isLoading}
            getRowId={(r) => r.name}
            emptyText="Noch keine Positionen vorhanden."
          />
        </CardContent>
      </Card>
    </div>
  );
}

// --- Tab: Umsatz- & Projektübersicht ---------------------------------------

function UebersichtTab({ range }: { range: DateRange }) {
  const { data: rep, isLoading } = useRevenueProjectsOverview(range);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Umsatz netto (Zeitraum)" value={fmtEUR(rep?.totalNet ?? 0)} />
        <KpiCard label="Erstellte Projekte" value={fmtNumber(rep?.totalCreated ?? 0, 0)} />
        <KpiCard label="Abgeschlossene Projekte" value={fmtNumber(rep?.totalCompleted ?? 0, 0)} />
      </div>

      <ChartCard title="Umsatz/Monat & Projekte/Monat">
        {isLoading ? (
          <LoadingState />
        ) : !rep?.monthly.length ? (
          <EmptyState text="Noch keine Daten für den gewählten Zeitraum." />
        ) : (
          <ResponsiveContainer width="100%" height={340}>
            <ComposedChart data={rep.monthly} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={70} />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => fmtNumber(Number(v), 0)}
                width={70}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12 }}
                allowDecimals={false}
                width={40}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number, name: string) =>
                  name === "Umsatz netto" ? [fmtEUR(v), name] : [fmtNumber(v, 0), name]
                }
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar yAxisId="right" dataKey="projectsCreated" name="Projekte erstellt" fill="#60a5fa" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="projectsCompleted" name="Projekte abgeschlossen" fill="#34d399" radius={[4, 4, 0, 0]} />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="net"
                name="Umsatz netto"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}

// --- Seite -----------------------------------------------------------------

export default function Auswertungen() {
  const [period, setPeriod] = useState<ReportPeriod>("this_year");
  const range = useMemo(() => periodRange(period), [period]);

  return (
    <div>
      <PageHeader title="Auswertungen" subtitle="Kennzahlen und Diagramme zu Umsatz, Projekten, Kunden und Zeiten" />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Dokumentendatum</span>
        <Select value={period} onValueChange={(v) => setPeriod(v as ReportPeriod)}>
          <SelectTrigger className="h-9 w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="umsaetze">
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="umsaetze" className="gap-1.5">
            <BarChart3 className="h-4 w-4" /> Umsätze
          </TabsTrigger>
          <TabsTrigger value="projekte" className="gap-1.5">
            <FolderKanban className="h-4 w-4" /> Projekte
          </TabsTrigger>
          <TabsTrigger value="kunden" className="gap-1.5">
            <Users className="h-4 w-4" /> Kunden
          </TabsTrigger>
          <TabsTrigger value="artikel" className="gap-1.5">
            <Package className="h-4 w-4" /> Artikel & Leistungen
          </TabsTrigger>
          <TabsTrigger value="mitarbeitende" className="gap-1.5">
            <Clock className="h-4 w-4" /> Mitarbeitende
          </TabsTrigger>
          <TabsTrigger value="uebersicht" className="gap-1.5">
            <LineChartIcon className="h-4 w-4" /> Umsatz- &amp; Projektübersicht
          </TabsTrigger>
        </TabsList>

        <TabsContent value="umsaetze"><UmsaetzeTab range={range} /></TabsContent>
        <TabsContent value="projekte"><ProjekteTab /></TabsContent>
        <TabsContent value="kunden"><KundenTab /></TabsContent>
        <TabsContent value="artikel"><ArtikelTab /></TabsContent>
        <TabsContent value="mitarbeitende"><MitarbeitendeTab /></TabsContent>
        <TabsContent value="uebersicht"><UebersichtTab range={range} /></TabsContent>
      </Tabs>
    </div>
  );
}
