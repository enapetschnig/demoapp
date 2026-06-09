import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables, TablesInsert } from "@/integrations/supabase/helpers";

export type ProjectType = Tables<"project_types">;
export type ProjectStep = Tables<"project_steps">;
export type NumberRange = Tables<"number_ranges">;

export type ProjectTypeWithSteps = ProjectType & {
  steps: ProjectStep[];
};

export function useProjectTypesAdmin() {
  const { company } = useAuth();
  return useQuery({
    queryKey: ["admin", "project_types", company?.id],
    enabled: !!company?.id,
    queryFn: async (): Promise<ProjectTypeWithSteps[]> => {
      const [typesRes, stepsRes] = await Promise.all([
        supabase
          .from("project_types")
          .select("*")
          .eq("company_id", company!.id)
          .order("sort_order", { ascending: true }),
        supabase
          .from("project_steps")
          .select("*")
          .eq("company_id", company!.id)
          .order("sort_order", { ascending: true }),
      ]);
      if (typesRes.error) throw typesRes.error;
      if (stepsRes.error) throw stepsRes.error;
      const steps = stepsRes.data ?? [];
      return (typesRes.data ?? []).map((t) => ({
        ...t,
        steps: steps.filter((s) => s.project_type_id === t.id),
      }));
    },
  });
}

export function useUpsertProjectStep() {
  const { company } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<ProjectStep> & { project_type_id: string }) => {
      const body = { ...payload, company_id: company!.id } as TablesInsert<"project_steps">;
      if (payload.id) {
        const { data, error } = await supabase
          .from("project_steps")
          .update(body)
          .eq("id", payload.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase.from("project_steps").insert(body).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "project_types"] }),
  });
}

export function useDeleteProjectStep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("project_steps").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "project_types"] }),
  });
}

export function useNumberRanges() {
  const { company } = useAuth();
  return useQuery({
    queryKey: ["admin", "number_ranges", company?.id],
    enabled: !!company?.id,
    queryFn: async (): Promise<NumberRange[]> => {
      const { data, error } = await supabase
        .from("number_ranges")
        .select("*")
        .eq("company_id", company!.id)
        .order("name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertNumberRange() {
  const { company } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<NumberRange> & { id?: string }) => {
      const body = { ...payload, company_id: company!.id } as TablesInsert<"number_ranges">;
      if (payload.id) {
        const { data, error } = await supabase
          .from("number_ranges")
          .update(body)
          .eq("id", payload.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase.from("number_ranges").insert(body).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "number_ranges"] }),
  });
}
