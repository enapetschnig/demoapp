import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables, TablesInsert } from "@/integrations/supabase/helpers";

export type TimeEntry = Tables<"time_entries">;
export type TimeCategory = Tables<"time_categories">;

/* ---------------- Zeiteinträge (time_entries) ---------------- */

export function useTimeEntries() {
  const { company } = useAuth();
  return useQuery({
    queryKey: ["time_entries", company?.id],
    enabled: !!company?.id,
    queryFn: async (): Promise<TimeEntry[]> => {
      const { data, error } = await supabase
        .from("time_entries")
        .select("*")
        .eq("company_id", company!.id)
        .neq("status", "geloescht")
        .order("entry_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertTimeEntry() {
  const { company } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<TimeEntry> & { id?: string }) => {
      const body = { ...payload, company_id: company!.id } as TablesInsert<"time_entries">;
      if (payload.id) {
        const { data, error } = await supabase
          .from("time_entries")
          .update(body)
          .eq("id", payload.id)
          .eq("company_id", company!.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase
        .from("time_entries")
        .insert(body)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["time_entries"] }),
  });
}

export function useConfirmTimeEntry() {
  const { company } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("time_entries")
        .update({ status: "bestaetigt" })
        .eq("id", id)
        .eq("company_id", company!.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["time_entries"] }),
  });
}

/* ---------------- Zeitkategorien (time_categories) ---------------- */

export function useTimeCategories() {
  const { company } = useAuth();
  return useQuery({
    queryKey: ["time_categories", company?.id],
    enabled: !!company?.id,
    queryFn: async (): Promise<TimeCategory[]> => {
      const { data, error } = await supabase
        .from("time_categories")
        .select("*")
        .eq("company_id", company!.id)
        .order("name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertTimeCategory() {
  const { company } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<TimeCategory> & { id?: string }) => {
      const body = { ...payload, company_id: company!.id } as TablesInsert<"time_categories">;
      if (payload.id) {
        const { data, error } = await supabase
          .from("time_categories")
          .update(body)
          .eq("id", payload.id)
          .eq("company_id", company!.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase
        .from("time_categories")
        .insert(body)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["time_categories"] }),
  });
}
