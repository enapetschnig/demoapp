import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables, TablesInsert } from "@/integrations/supabase/helpers";

export type Employee = Tables<"profiles">;
export type WageGroup = Tables<"wage_groups">;
export type Absence = Tables<"absences">;
export type AbsenceType = Tables<"absence_types">;

/* ---------------- Mitarbeiter (profiles) ---------------- */

export function useEmployees() {
  const { company } = useAuth();
  return useQuery({
    queryKey: ["employees", company?.id],
    enabled: !!company?.id,
    queryFn: async (): Promise<Employee[]> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("company_id", company!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpdateEmployee() {
  const { company } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Employee> & { id: string }) => {
      const { id, ...rest } = payload;
      const { data, error } = await supabase
        .from("profiles")
        .update(rest)
        .eq("id", id)
        .eq("company_id", company!.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employees"] }),
  });
}

/* ---------------- Lohngruppen (wage_groups) ---------------- */

export function useWageGroups() {
  const { company } = useAuth();
  return useQuery({
    queryKey: ["wage_groups", company?.id],
    enabled: !!company?.id,
    queryFn: async (): Promise<WageGroup[]> => {
      const { data, error } = await supabase
        .from("wage_groups")
        .select("*")
        .eq("company_id", company!.id)
        .order("name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertWageGroup() {
  const { company } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<WageGroup> & { id?: string }) => {
      const body = { ...payload, company_id: company!.id } as TablesInsert<"wage_groups">;
      if (payload.id) {
        const { data, error } = await supabase
          .from("wage_groups")
          .update(body)
          .eq("id", payload.id)
          .eq("company_id", company!.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase
        .from("wage_groups")
        .insert(body)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wage_groups"] }),
  });
}

export function useDeleteWageGroup() {
  const { company } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("wage_groups")
        .delete()
        .eq("id", id)
        .eq("company_id", company!.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wage_groups"] }),
  });
}

/* ---------------- Abwesenheiten (absences) ---------------- */

export function useAbsences() {
  const { company } = useAuth();
  return useQuery({
    queryKey: ["absences", company?.id],
    enabled: !!company?.id,
    queryFn: async (): Promise<Absence[]> => {
      const { data, error } = await supabase
        .from("absences")
        .select("*")
        .eq("company_id", company!.id)
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertAbsence() {
  const { company } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Absence> & { id?: string }) => {
      const body = { ...payload, company_id: company!.id } as TablesInsert<"absences">;
      if (payload.id) {
        const { data, error } = await supabase
          .from("absences")
          .update(body)
          .eq("id", payload.id)
          .eq("company_id", company!.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase
        .from("absences")
        .insert(body)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["absences"] }),
  });
}

export function useSetAbsenceStatus() {
  const { company } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from("absences")
        .update({ status })
        .eq("id", id)
        .eq("company_id", company!.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["absences"] }),
  });
}

/* ---------------- Abwesenheitsarten (absence_types) ---------------- */

export function useAbsenceTypes() {
  const { company } = useAuth();
  return useQuery({
    queryKey: ["absence_types", company?.id],
    enabled: !!company?.id,
    queryFn: async (): Promise<AbsenceType[]> => {
      const { data, error } = await supabase
        .from("absence_types")
        .select("*")
        .eq("company_id", company!.id)
        .order("name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}
