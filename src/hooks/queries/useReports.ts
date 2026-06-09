import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { INVOICE_TYPES } from "@/hooks/queries/usePayments";
import { docLabel } from "@/lib/documentTypes";

// ---------------------------------------------------------------------------
// Hilfstypen für aggregierte Auswertungsdaten.
// ---------------------------------------------------------------------------

export interface MonthlyRevenue {
  month: string; // "2026-01"
  label: string; // "Jän 2026"
  net: number;
  gross: number;
  count: number;
}

export interface RevenueReport {
  monthly: MonthlyRevenue[];
  totalNet: number;
  totalGross: number;
  invoiceCount: number;
  avgInvoice: number;
}

export interface DocTypeCount {
  baseType: string;
  label: string;
  count: number;
  gross: number;
}

export interface ProjectsByType {
  typeId: string;
  name: string;
  count: number;
  value: number;
}

export interface ProjectReport {
  byType: ProjectsByType[];
  total: number;
  totalValue: number;
  avgValue: number;
}

export interface TopCustomer {
  customerId: string;
  name: string;
  gross: number;
  count: number;
}

export interface CustomerReport {
  top: TopCustomer[];
  contactCount: number;
  customerCount: number;
  invoicedCustomers: number;
}

export interface EmployeeHours {
  employeeId: string;
  name: string;
  hours: number;
  entries: number;
}

export interface CategoryHours {
  categoryId: string;
  name: string;
  hours: number;
}

export interface TimeReport {
  byEmployee: EmployeeHours[];
  byCategory: CategoryHours[];
  totalHours: number;
  entryCount: number;
}

const MONTH_LABELS = [
  "Jän", "Feb", "Mär", "Apr", "Mai", "Jun",
  "Jul", "Aug", "Sep", "Okt", "Nov", "Dez",
];

const monthKey = (iso: string): string => iso.slice(0, 7);
const monthLabel = (key: string): string => {
  const [y, m] = key.split("-");
  const idx = Number(m) - 1;
  return `${MONTH_LABELS[idx] ?? m} ${y}`;
};

const contactName = (c: {
  company_name: string | null;
  first_name: string | null;
  last_name: string | null;
}): string => {
  if (c.company_name) return c.company_name;
  const full = [c.first_name, c.last_name].filter(Boolean).join(" ").trim();
  return full || "Unbekannt";
};

// ---------------------------------------------------------------------------
// Umsätze: monatlicher Umsatz aus rechnungsartigen Dokumenten + Typverteilung.
// ---------------------------------------------------------------------------

export function useRevenueReport() {
  const { company } = useAuth();
  return useQuery({
    queryKey: ["report", "revenue", company?.id],
    enabled: !!company?.id,
    queryFn: async (): Promise<RevenueReport> => {
      const { data, error } = await supabase
        .from("documents")
        .select("net_amount,gross_amount,doc_date")
        .eq("company_id", company!.id)
        .eq("is_deleted", false)
        .in("base_type", INVOICE_TYPES)
        .order("doc_date", { ascending: true });
      if (error) throw error;
      const rows = data ?? [];

      const map = new Map<string, MonthlyRevenue>();
      let totalNet = 0;
      let totalGross = 0;
      for (const r of rows) {
        if (!r.doc_date) continue;
        const key = monthKey(r.doc_date);
        const net = Number(r.net_amount);
        const gross = Number(r.gross_amount);
        totalNet += net;
        totalGross += gross;
        const e = map.get(key) ?? { month: key, label: monthLabel(key), net: 0, gross: 0, count: 0 };
        e.net += net;
        e.gross += gross;
        e.count += 1;
        map.set(key, e);
      }
      const monthly = [...map.values()].sort((a, b) => a.month.localeCompare(b.month));
      const invoiceCount = rows.length;
      return {
        monthly,
        totalNet,
        totalGross,
        invoiceCount,
        avgInvoice: invoiceCount ? totalNet / invoiceCount : 0,
      };
    },
  });
}

export function useDocTypeCounts() {
  const { company } = useAuth();
  return useQuery({
    queryKey: ["report", "doc-types", company?.id],
    enabled: !!company?.id,
    queryFn: async (): Promise<DocTypeCount[]> => {
      const { data, error } = await supabase
        .from("documents")
        .select("base_type,gross_amount")
        .eq("company_id", company!.id)
        .eq("is_deleted", false);
      if (error) throw error;
      const rows = data ?? [];

      const map = new Map<string, DocTypeCount>();
      for (const r of rows) {
        const bt = r.base_type;
        const e = map.get(bt) ?? { baseType: bt, label: docLabel(bt), count: 0, gross: 0 };
        e.count += 1;
        e.gross += Number(r.gross_amount);
        map.set(bt, e);
      }
      return [...map.values()].sort((a, b) => b.count - a.count);
    },
  });
}

// ---------------------------------------------------------------------------
// Projekte: Anzahl + Auftragsvolumen je Gewerk (project_type).
// ---------------------------------------------------------------------------

export function useProjectReport() {
  const { company } = useAuth();
  return useQuery({
    queryKey: ["report", "projects", company?.id],
    enabled: !!company?.id,
    queryFn: async (): Promise<ProjectReport> => {
      const [projRes, typeRes] = await Promise.all([
        supabase
          .from("projects")
          .select("project_type_id,value")
          .eq("company_id", company!.id)
          .eq("is_archived", false),
        supabase
          .from("project_types")
          .select("id,name")
          .eq("company_id", company!.id),
      ]);
      if (projRes.error) throw projRes.error;
      if (typeRes.error) throw typeRes.error;
      const projects = projRes.data ?? [];
      const types = typeRes.data ?? [];

      const typeName = new Map(types.map((t) => [t.id, t.name]));
      const map = new Map<string, ProjectsByType>();
      let totalValue = 0;
      for (const p of projects) {
        const tid = p.project_type_id ?? "none";
        const name = p.project_type_id ? (typeName.get(p.project_type_id) ?? "Unbekannt") : "Ohne Gewerk";
        const val = Number(p.value ?? 0);
        totalValue += val;
        const e = map.get(tid) ?? { typeId: tid, name, count: 0, value: 0 };
        e.count += 1;
        e.value += val;
        map.set(tid, e);
      }
      const byType = [...map.values()].sort((a, b) => b.count - a.count);
      const total = projects.length;
      return {
        byType,
        total,
        totalValue,
        avgValue: total ? totalValue / total : 0,
      };
    },
  });
}

// ---------------------------------------------------------------------------
// Kunden: Top-Kunden nach Rechnungsumsatz + Kontaktkennzahlen.
// ---------------------------------------------------------------------------

export function useCustomerReport() {
  const { company } = useAuth();
  return useQuery({
    queryKey: ["report", "customers", company?.id],
    enabled: !!company?.id,
    queryFn: async (): Promise<CustomerReport> => {
      const [docRes, contactRes] = await Promise.all([
        supabase
          .from("documents")
          .select("customer_id,gross_amount")
          .eq("company_id", company!.id)
          .eq("is_deleted", false)
          .in("base_type", INVOICE_TYPES),
        supabase
          .from("contacts")
          .select("id,company_name,first_name,last_name,category,is_archived")
          .eq("company_id", company!.id),
      ]);
      if (docRes.error) throw docRes.error;
      if (contactRes.error) throw contactRes.error;
      const docs = docRes.data ?? [];
      const contacts = contactRes.data ?? [];

      const nameById = new Map(
        contacts.map((c) => [c.id, contactName(c)]),
      );

      const map = new Map<string, TopCustomer>();
      for (const d of docs) {
        if (!d.customer_id) continue;
        const e = map.get(d.customer_id) ?? {
          customerId: d.customer_id,
          name: nameById.get(d.customer_id) ?? "Unbekannt",
          gross: 0,
          count: 0,
        };
        e.gross += Number(d.gross_amount);
        e.count += 1;
        map.set(d.customer_id, e);
      }
      const top = [...map.values()].sort((a, b) => b.gross - a.gross).slice(0, 10);

      const active = contacts.filter((c) => !c.is_archived);
      return {
        top,
        contactCount: active.length,
        customerCount: active.filter((c) => c.category === "kunde").length,
        invoicedCustomers: map.size,
      };
    },
  });
}

// ---------------------------------------------------------------------------
// Mitarbeitende: erfasste Stunden je Mitarbeiter:in + je Kategorie.
// ---------------------------------------------------------------------------

export function useTimeReport() {
  const { company } = useAuth();
  return useQuery({
    queryKey: ["report", "time", company?.id],
    enabled: !!company?.id,
    queryFn: async (): Promise<TimeReport> => {
      const [entryRes, profileRes, catRes] = await Promise.all([
        supabase
          .from("time_entries")
          .select("employee_id,category_id,duration_minutes")
          .eq("company_id", company!.id),
        supabase
          .from("profiles")
          .select("id,first_name,last_name")
          .eq("company_id", company!.id),
        supabase
          .from("time_categories")
          .select("id,name")
          .eq("company_id", company!.id),
      ]);
      if (entryRes.error) throw entryRes.error;
      if (profileRes.error) throw profileRes.error;
      if (catRes.error) throw catRes.error;
      const entries = entryRes.data ?? [];
      const profiles = profileRes.data ?? [];
      const cats = catRes.data ?? [];

      const profName = new Map(
        profiles.map((p) => [
          p.id,
          [p.first_name, p.last_name].filter(Boolean).join(" ").trim() || "Unbekannt",
        ]),
      );
      const catName = new Map(cats.map((c) => [c.id, c.name]));

      const empMap = new Map<string, EmployeeHours>();
      const catMap = new Map<string, CategoryHours>();
      let totalMinutes = 0;
      for (const e of entries) {
        const min = Number(e.duration_minutes ?? 0);
        totalMinutes += min;

        const eid = e.employee_id ?? "none";
        const ename = e.employee_id ? (profName.get(e.employee_id) ?? "Unbekannt") : "Ohne Zuordnung";
        const emp = empMap.get(eid) ?? { employeeId: eid, name: ename, hours: 0, entries: 0 };
        emp.hours += min / 60;
        emp.entries += 1;
        empMap.set(eid, emp);

        const cid = e.category_id ?? "none";
        const cname = e.category_id ? (catName.get(e.category_id) ?? "Unbekannt") : "Ohne Kategorie";
        const cat = catMap.get(cid) ?? { categoryId: cid, name: cname, hours: 0 };
        cat.hours += min / 60;
        catMap.set(cid, cat);
      }

      return {
        byEmployee: [...empMap.values()].sort((a, b) => b.hours - a.hours),
        byCategory: [...catMap.values()].sort((a, b) => b.hours - a.hours),
        totalHours: totalMinutes / 60,
        entryCount: entries.length,
      };
    },
  });
}
