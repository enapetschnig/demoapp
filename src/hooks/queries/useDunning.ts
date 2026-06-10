import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables, TablesInsert } from "@/integrations/supabase/helpers";
import { toISODate } from "@/lib/format";

export const OVERDUE_TYPES = ["rechnung", "rechnung_13b"];
export const OVERDUE_PAYMENT_STATUS = ["offen", "teilzahlung"];

export type DunningLevel = Tables<"dunning_levels">;
export type CostCenter = Tables<"cost_centers">;
export type Dunning = Tables<"dunnings">;

export type OverdueInvoice = Tables<"documents"> & {
  customer?: {
    first_name: string | null;
    last_name: string | null;
    company_name: string | null;
    customer_number: string | null;
  } | null;
  dunning_count: number;
  max_dunning_level: number;
};

const DOC_SELECT =
  "*, customer:customer_id(first_name,last_name,company_name,customer_number)";

// Überfällige Rechnungen: base_type in (rechnung, rechnung_13b),
// payment_status in (offen, teilzahlung) und due_date < heute.
export function useOverdueInvoices() {
  const { company } = useAuth();
  return useQuery({
    queryKey: ["overdue-invoices", company?.id],
    enabled: !!company?.id,
    queryFn: async (): Promise<OverdueInvoice[]> => {
      const today = toISODate();
      const { data, error } = await supabase
        .from("documents")
        .select(DOC_SELECT)
        .eq("company_id", company!.id)
        .eq("is_deleted", false)
        .in("base_type", OVERDUE_TYPES)
        .in("payment_status", OVERDUE_PAYMENT_STATUS as Array<Tables<"documents">["payment_status"]>)
        .lt("due_date", today)
        .order("due_date", { ascending: true });
      if (error) throw error;

      const docs = (data ?? []) as unknown as OverdueInvoice[];

      // Bereits erstellte Mahnungen je Dokument laden, um die aktuelle Stufe zu ermitteln.
      const ids = docs.map((d) => d.id);
      let dunnings: Dunning[] = [];
      if (ids.length) {
        const { data: dn, error: dnErr } = await supabase
          .from("dunnings")
          .select("*")
          .eq("company_id", company!.id)
          .in("document_id", ids);
        if (dnErr) throw dnErr;
        dunnings = dn ?? [];
      }

      return docs.map((d) => {
        const rows = dunnings.filter((x) => x.document_id === d.id);
        const maxLevel = rows.reduce(
          (m, r) => (Number(r.level) > m ? Number(r.level) : m),
          0,
        );
        return { ...d, dunning_count: rows.length, max_dunning_level: maxLevel };
      });
    },
  });
}

export interface CreateDunningInput {
  document_id: string;
  current_level: number;
  note?: string | null;
}

// Neue Mahnung anlegen -> Stufe = current_level + 1.
export function useCreateDunning() {
  const { company } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateDunningInput) => {
      const newLevel = input.current_level + 1;
      // Gebühr aus der passenden Mahnstufe übernehmen (bevorzugt Typ "mahnung").
      const { data: levels } = await supabase
        .from("dunning_levels").select("level,type,fee")
        .eq("company_id", company!.id).eq("level", newLevel);
      const match = (levels ?? []).find((l) => l.type === "mahnung") ?? (levels ?? [])[0];
      const fee = Number(match?.fee ?? 0);
      const body: TablesInsert<"dunnings"> = {
        company_id: company!.id,
        document_id: input.document_id,
        level: newLevel,
        fee,
        sent_at: toISODate(),
        note: input.note ?? null,
      };
      const { data, error } = await supabase
        .from("dunnings")
        .insert(body)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["overdue-invoices"] });
      qc.invalidateQueries({ queryKey: ["dunnings"] });
    },
  });
}

export function useDunningLevels() {
  const { company } = useAuth();
  return useQuery({
    queryKey: ["dunning-levels", company?.id],
    enabled: !!company?.id,
    queryFn: async (): Promise<DunningLevel[]> => {
      const { data, error } = await supabase
        .from("dunning_levels")
        .select("*")
        .eq("company_id", company!.id)
        .order("sort_order", { ascending: true })
        .order("level", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertDunningLevel() {
  const { company } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<DunningLevel> & { id?: string }) => {
      const body = { ...payload, company_id: company!.id } as TablesInsert<"dunning_levels">;
      if (payload.id) {
        const { data, error } = await supabase
          .from("dunning_levels")
          .update(body)
          .eq("id", payload.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase
        .from("dunning_levels")
        .insert(body)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dunning-levels"] }),
  });
}

export function useDeleteDunningLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("dunning_levels").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dunning-levels"] }),
  });
}

export function useCostCenters() {
  const { company } = useAuth();
  return useQuery({
    queryKey: ["cost-centers", company?.id],
    enabled: !!company?.id,
    queryFn: async (): Promise<CostCenter[]> => {
      const { data, error } = await supabase
        .from("cost_centers")
        .select("*")
        .eq("company_id", company!.id)
        .order("number", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertCostCenter() {
  const { company } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<CostCenter> & { id?: string }) => {
      const body = { ...payload, company_id: company!.id } as TablesInsert<"cost_centers">;
      if (payload.id) {
        const { data, error } = await supabase
          .from("cost_centers")
          .update(body)
          .eq("id", payload.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase
        .from("cost_centers")
        .insert(body)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cost-centers"] }),
  });
}

export function useDeleteCostCenter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cost_centers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cost-centers"] }),
  });
}
