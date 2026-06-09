import { ReactNode } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { fmtEUR, fmtNumber } from "@/lib/format";
import {
  useRevenueReport,
  useDocTypeCounts,
  useProjectReport,
  useCustomerReport,
  useTimeReport,
} from "@/hooks/queries/useReports";
import { BarChart3, FolderKanban, Users, Clock, Inbox, Loader2 } from "lucide-react";

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

function UmsaetzeTab() {
  const { data: rev, isLoading: revLoading } = useRevenueReport();
  const { data: docTypes = [], isLoading: docLoading } = useDocTypeCounts();

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

// --- Seite -----------------------------------------------------------------

export default function Auswertungen() {
  return (
    <div>
      <PageHeader title="Auswertungen" subtitle="Kennzahlen und Diagramme zu Umsatz, Projekten, Kunden und Zeiten" />

      <Tabs defaultValue="umsaetze">
        <TabsList className="mb-4">
          <TabsTrigger value="umsaetze" className="gap-1.5">
            <BarChart3 className="h-4 w-4" /> Umsätze
          </TabsTrigger>
          <TabsTrigger value="projekte" className="gap-1.5">
            <FolderKanban className="h-4 w-4" /> Projekte
          </TabsTrigger>
          <TabsTrigger value="kunden" className="gap-1.5">
            <Users className="h-4 w-4" /> Kunden
          </TabsTrigger>
          <TabsTrigger value="mitarbeitende" className="gap-1.5">
            <Clock className="h-4 w-4" /> Mitarbeitende
          </TabsTrigger>
        </TabsList>

        <TabsContent value="umsaetze"><UmsaetzeTab /></TabsContent>
        <TabsContent value="projekte"><ProjekteTab /></TabsContent>
        <TabsContent value="kunden"><KundenTab /></TabsContent>
        <TabsContent value="mitarbeitende"><MitarbeitendeTab /></TabsContent>
      </Tabs>
    </div>
  );
}
