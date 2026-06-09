import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/helpers";

export type ProjectType = Tables<"project_types">;
export type ProjectStep = Tables<"project_steps">;
export type ProjectRow = Tables<"projects"> & {
  project_types?: { name: string; code: string | null; color: string | null } | null;
  customer?: { first_name: string | null; last_name: string | null; company_name: string | null } | null;
  current_step?: { name: string; status_code: number } | null;
  source?: { name: string } | null;
};

const PROJECT_SELECT =
  "*, project_types(name,code,color), customer:customer_id(first_name,last_name,company_name), current_step:current_step_id(name,status_code), source:source_id(name)";

export function useProjects() {
  const { company } = useAuth();
  return useQuery({
    queryKey: ["projects", company?.id],
    enabled: !!company?.id,
    queryFn: async (): Promise<ProjectRow[]> => {
      const { data, error } = await supabase
        .from("projects").select(PROJECT_SELECT)
        .eq("company_id", company!.id).eq("is_archived", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ProjectRow[];
    },
  });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: ["project", id],
    enabled: !!id,
    queryFn: async (): Promise<ProjectRow | null> => {
      const { data, error } = await supabase.from("projects").select(PROJECT_SELECT).eq("id", id!).maybeSingle();
      if (error) throw error;
      return data as unknown as ProjectRow | null;
    },
  });
}

export function useProjectTypes() {
  const { company } = useAuth();
  return useQuery({
    queryKey: ["project_types", company?.id],
    enabled: !!company?.id,
    queryFn: async () => {
      const { data: types, error } = await supabase.from("project_types").select("*").eq("company_id", company!.id).eq("status", "aktiv").order("sort_order");
      if (error) throw error;
      const { data: steps } = await supabase.from("project_steps").select("*").eq("company_id", company!.id).order("sort_order");
      return (types ?? []).map((t) => ({ ...t, steps: (steps ?? []).filter((s) => s.project_type_id === t.id) }));
    },
  });
}

export function useCreateProject() {
  const { company } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { project_type_id: string; customer_id?: string | null; name?: string; address_street?: string; address_zip?: string; address_city?: string; source_id?: string | null; value?: number; current_step_id?: string | null; }) => {
      const { data: num } = await supabase.rpc("next_project_number", { p_company: company!.id });
      const { data, error } = await supabase.from("projects").insert({
        company_id: company!.id,
        project_number: num as number,
        project_type_id: input.project_type_id,
        customer_id: input.customer_id ?? null,
        name: input.name,
        address_street: input.address_street,
        address_zip: input.address_zip,
        address_city: input.address_city,
        source_id: input.source_id ?? null,
        value: input.value ?? 0,
        current_step_id: input.current_step_id ?? null,
      }).select().single();
      if (error) throw error;
      await supabase.from("activity_log").insert({
        company_id: company!.id, entity_type: "project", entity_id: data.id,
        type: "system", title: "Projekt angelegt", message: `Projekt wurde erstellt`,
      });
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["projects"] }); qc.invalidateQueries({ queryKey: ["count", "projects"] }); },
  });
}

export function useMoveProjectStep() {
  const { company } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, stepId, stepName }: { projectId: string; stepId: string; stepName: string }) => {
      const { error } = await supabase.from("projects").update({ current_step_id: stepId }).eq("id", projectId);
      if (error) throw error;
      await supabase.from("activity_log").insert({
        company_id: company!.id, entity_type: "project", entity_id: projectId,
        type: "status", title: `Status: ${stepName}`, message: `Das Projekt wurde in ${stepName} verschoben`,
      });
    },
    onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: ["projects"] }); qc.invalidateQueries({ queryKey: ["project", v.projectId] }); qc.invalidateQueries({ queryKey: ["activity", "project", v.projectId] }); },
  });
}

export function useActivityLog(entityType: string, entityId: string | undefined) {
  return useQuery({
    queryKey: ["activity", entityType, entityId],
    enabled: !!entityId,
    queryFn: async () => {
      const { data } = await supabase.from("activity_log").select("*").eq("entity_type", entityType).eq("entity_id", entityId!).order("created_at", { ascending: false });
      return data ?? [];
    },
  });
}

export function useAddLogEntry() {
  const { company } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ entityType, entityId, message }: { entityType: string; entityId: string; message: string }) => {
      const { error } = await supabase.from("activity_log").insert({
        company_id: company!.id, entity_type: entityType, entity_id: entityId,
        type: "kommentar", title: "Kommentar", message,
      });
      if (error) throw error;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["activity", v.entityType, v.entityId] }),
  });
}
