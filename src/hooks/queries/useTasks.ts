import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables, TablesInsert } from "@/integrations/supabase/helpers";

export type Task = Tables<"tasks">;
export type Profile = Tables<"profiles">;
export type Project = Tables<"projects">;

export function useTasks() {
  const { company } = useAuth();
  return useQuery({
    queryKey: ["tasks", company?.id],
    enabled: !!company?.id,
    queryFn: async (): Promise<Task[]> => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("company_id", company!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useTaskProfiles() {
  const { company } = useAuth();
  return useQuery({
    queryKey: ["task-profiles", company?.id],
    enabled: !!company?.id,
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("company_id", company!.id)
        .order("first_name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useTaskProjects() {
  const { company } = useAuth();
  return useQuery({
    queryKey: ["task-projects", company?.id],
    enabled: !!company?.id,
    queryFn: async (): Promise<Project[]> => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("company_id", company!.id)
        .order("project_number", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertTask() {
  const { company, profile } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Task> & { id?: string }) => {
      if (payload.id) {
        const body = { ...payload, company_id: company!.id } as TablesInsert<"tasks">;
        const { data, error } = await supabase
          .from("tasks")
          .update(body)
          .eq("id", payload.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const body = {
        ...payload,
        company_id: company!.id,
        created_by: profile?.id ?? null,
      } as TablesInsert<"tasks">;
      const { data, error } = await supabase.from("tasks").insert(body).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["count", "tasks"] });
    },
  });
}

export function useToggleTaskDone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      const { data, error } = await supabase
        .from("tasks")
        .update({ done_at: done ? new Date().toISOString() : null })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
