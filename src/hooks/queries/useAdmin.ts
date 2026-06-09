import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables, TablesInsert } from "@/integrations/supabase/helpers";

export type Branch = Tables<"branches">;
export type ProjectSource = Tables<"project_sources">;
export type DocumentFolder = Tables<"document_folders">;
export type CustomFieldDef = Tables<"custom_field_defs">;
export type Checklist = Tables<"checklists">;
export type EmailTemplate = Tables<"email_templates">;

/* ----------------------------- Niederlassungen ----------------------------- */

export function useBranches() {
  const { company } = useAuth();
  return useQuery({
    queryKey: ["branches", company?.id],
    enabled: !!company?.id,
    queryFn: async (): Promise<Branch[]> => {
      const { data, error } = await supabase
        .from("branches")
        .select("*")
        .eq("company_id", company!.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

// Mitarbeiteranzahl je Niederlassung (über profiles.branch_id).
export function useBranchEmployeeCounts() {
  const { company } = useAuth();
  return useQuery({
    queryKey: ["branch-employee-counts", company?.id],
    enabled: !!company?.id,
    queryFn: async (): Promise<Record<string, number>> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("branch_id")
        .eq("company_id", company!.id);
      if (error) throw error;
      const counts: Record<string, number> = {};
      for (const row of data ?? []) {
        if (row.branch_id) counts[row.branch_id] = (counts[row.branch_id] ?? 0) + 1;
      }
      return counts;
    },
  });
}

export function useUpsertBranch() {
  const { company } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Branch> & { id?: string }) => {
      const body = { ...payload, company_id: company!.id } as TablesInsert<"branches">;
      if (payload.id) {
        const { data, error } = await supabase.from("branches").update(body).eq("id", payload.id).select().single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase.from("branches").insert(body).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["branches"] }),
  });
}

export function useDeleteBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("branches").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["branches"] }),
  });
}

/* ------------------------------- Quellen ------------------------------- */

export function useProjectSources() {
  const { company } = useAuth();
  return useQuery({
    queryKey: ["project_sources", company?.id],
    enabled: !!company?.id,
    queryFn: async (): Promise<ProjectSource[]> => {
      const { data, error } = await supabase
        .from("project_sources")
        .select("*")
        .eq("company_id", company!.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertProjectSource() {
  const { company } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<ProjectSource> & { id?: string }) => {
      const body = { ...payload, company_id: company!.id } as TablesInsert<"project_sources">;
      if (payload.id) {
        const { data, error } = await supabase.from("project_sources").update(body).eq("id", payload.id).select().single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase.from("project_sources").insert(body).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["project_sources"] }),
  });
}

export function useDeleteProjectSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("project_sources").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["project_sources"] }),
  });
}

/* ------------------------------- Ordner ------------------------------- */

export function useDocumentFolders() {
  const { company } = useAuth();
  return useQuery({
    queryKey: ["document_folders", company?.id],
    enabled: !!company?.id,
    queryFn: async (): Promise<DocumentFolder[]> => {
      const { data, error } = await supabase
        .from("document_folders")
        .select("*")
        .eq("company_id", company!.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertDocumentFolder() {
  const { company } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<DocumentFolder> & { id?: string }) => {
      const body = { ...payload, company_id: company!.id } as TablesInsert<"document_folders">;
      if (payload.id) {
        const { data, error } = await supabase.from("document_folders").update(body).eq("id", payload.id).select().single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase.from("document_folders").insert(body).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["document_folders"] }),
  });
}

export function useDeleteDocumentFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("document_folders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["document_folders"] }),
  });
}

/* ----------------------------- Eigene Felder ----------------------------- */

export function useCustomFieldDefs() {
  const { company } = useAuth();
  return useQuery({
    queryKey: ["custom_field_defs", company?.id],
    enabled: !!company?.id,
    queryFn: async (): Promise<CustomFieldDef[]> => {
      const { data, error } = await supabase
        .from("custom_field_defs")
        .select("*")
        .eq("company_id", company!.id)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertCustomFieldDef() {
  const { company } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<CustomFieldDef> & { id?: string }) => {
      const body = { ...payload, company_id: company!.id } as TablesInsert<"custom_field_defs">;
      if (payload.id) {
        const { data, error } = await supabase.from("custom_field_defs").update(body).eq("id", payload.id).select().single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase.from("custom_field_defs").insert(body).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["custom_field_defs"] }),
  });
}

export function useDeleteCustomFieldDef() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("custom_field_defs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["custom_field_defs"] }),
  });
}

/* ------------------------------- Checklisten ------------------------------- */

export function useChecklists() {
  const { company } = useAuth();
  return useQuery({
    queryKey: ["checklists", company?.id],
    enabled: !!company?.id,
    queryFn: async (): Promise<Checklist[]> => {
      const { data, error } = await supabase
        .from("checklists")
        .select("*")
        .eq("company_id", company!.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertChecklist() {
  const { company } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Checklist> & { id?: string }) => {
      const body = { ...payload, company_id: company!.id } as TablesInsert<"checklists">;
      if (payload.id) {
        const { data, error } = await supabase.from("checklists").update(body).eq("id", payload.id).select().single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase.from("checklists").insert(body).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["checklists"] }),
  });
}

export function useDeleteChecklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("checklists").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["checklists"] }),
  });
}

/* ----------------------------- E-Mail-Vorlagen ----------------------------- */

export function useEmailTemplates() {
  const { company } = useAuth();
  return useQuery({
    queryKey: ["email_templates", company?.id],
    enabled: !!company?.id,
    queryFn: async (): Promise<EmailTemplate[]> => {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .eq("company_id", company!.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertEmailTemplate() {
  const { company } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<EmailTemplate> & { id?: string }) => {
      const body = { ...payload, company_id: company!.id } as TablesInsert<"email_templates">;
      if (payload.id) {
        const { data, error } = await supabase.from("email_templates").update(body).eq("id", payload.id).select().single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase.from("email_templates").insert(body).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email_templates"] }),
  });
}

export function useDeleteEmailTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("email_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email_templates"] }),
  });
}
