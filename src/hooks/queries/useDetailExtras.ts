import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables, TablesInsert } from "@/integrations/supabase/helpers";

export type ObjectAddress = Tables<"object_addresses">;
export type ProjectChecklist = Tables<"project_checklists">;
export interface ChecklistItem { text: string; done: boolean }

/* ---------------- Objektadressen (je Kontakt) ---------------- */
export function useObjectAddresses(contactId: string | undefined) {
  const { company } = useAuth();
  return useQuery({
    queryKey: ["object-addresses", contactId, company?.id],
    enabled: !!contactId && !!company?.id,
    queryFn: async (): Promise<ObjectAddress[]> => {
      const { data, error } = await supabase.from("object_addresses").select("*")
        .eq("company_id", company!.id).eq("contact_id", contactId!).order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertObjectAddress() {
  const { company } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<ObjectAddress> & { contact_id: string }) => {
      const body = { ...payload, company_id: company!.id } as TablesInsert<"object_addresses">;
      const q = payload.id
        ? supabase.from("object_addresses").update(body).eq("id", payload.id).select().single()
        : supabase.from("object_addresses").insert(body).select().single();
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["object-addresses"] }),
  });
}

export function useDeleteObjectAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("object_addresses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["object-addresses"] }),
  });
}

/* ---------------- Projekt-Checklisten ---------------- */
export function useProjectChecklists(projectId: string | undefined) {
  const { company } = useAuth();
  return useQuery({
    queryKey: ["project-checklists", projectId, company?.id],
    enabled: !!projectId && !!company?.id,
    queryFn: async (): Promise<ProjectChecklist[]> => {
      const { data, error } = await supabase.from("project_checklists").select("*")
        .eq("company_id", company!.id).eq("project_id", projectId!).order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });
}

// Checklisten-Vorlagen aus dem Admin-Bereich
export function useChecklistTemplates() {
  const { company } = useAuth();
  return useQuery({
    queryKey: ["checklist-templates", company?.id],
    enabled: !!company?.id,
    queryFn: async () => {
      const { data } = await supabase.from("checklists").select("id,name,items").eq("company_id", company!.id).order("name");
      return data ?? [];
    },
  });
}

export function useUpsertProjectChecklist() {
  const { company } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id?: string; project_id: string; name: string; items: ChecklistItem[] }) => {
      const body = { ...payload, company_id: company!.id, items: payload.items as unknown } as TablesInsert<"project_checklists">;
      const q = payload.id
        ? supabase.from("project_checklists").update(body).eq("id", payload.id).select().single()
        : supabase.from("project_checklists").insert(body).select().single();
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["project-checklists"] }),
  });
}

export function useDeleteProjectChecklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("project_checklists").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["project-checklists"] }),
  });
}
