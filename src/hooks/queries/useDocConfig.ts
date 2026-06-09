import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/helpers";

export type DocumentText = Tables<"document_texts">;
export type DocumentTypeConfig = Tables<"document_types">;
export type DocumentFolder = Tables<"document_folders">;
export type ProjectStep = Tables<"project_steps">;

// --- Texte & Titel ---------------------------------------------------------

export function useDocumentTexts() {
  const { company } = useAuth();
  return useQuery({
    queryKey: ["document_texts", company?.id],
    enabled: !!company?.id,
    queryFn: async (): Promise<DocumentText[]> => {
      const { data, error } = await supabase
        .from("document_texts")
        .select("*")
        .eq("company_id", company!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertDocumentText() {
  const { company } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<DocumentText> & { id?: string }) => {
      const body = { ...payload, company_id: company!.id } as TablesInsert<"document_texts">;
      if (payload.id) {
        const { data, error } = await supabase
          .from("document_texts")
          .update(body)
          .eq("id", payload.id)
          .eq("company_id", company!.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase
        .from("document_texts")
        .insert(body)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["document_texts"] }),
  });
}

export function useDeleteDocumentText() {
  const { company } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("document_texts")
        .delete()
        .eq("id", id)
        .eq("company_id", company!.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["document_texts"] }),
  });
}

// --- Dokumententypen / Konfigurator ---------------------------------------

export function useDocumentTypesConfig() {
  const { company } = useAuth();
  return useQuery({
    queryKey: ["document_types", company?.id],
    enabled: !!company?.id,
    queryFn: async (): Promise<DocumentTypeConfig[]> => {
      const { data, error } = await supabase
        .from("document_types")
        .select("*")
        .eq("company_id", company!.id)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpdateDocumentType() {
  const { company } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TablesUpdate<"document_types"> & { id: string }) => {
      const { id, ...rest } = payload;
      const { data, error } = await supabase
        .from("document_types")
        .update(rest)
        .eq("id", id)
        .eq("company_id", company!.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["document_types"] }),
  });
}

// --- Stammdaten für Selects ------------------------------------------------

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
        .order("name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useProjectSteps() {
  const { company } = useAuth();
  return useQuery({
    queryKey: ["project_steps", company?.id],
    enabled: !!company?.id,
    queryFn: async (): Promise<ProjectStep[]> => {
      const { data, error } = await supabase
        .from("project_steps")
        .select("*")
        .eq("company_id", company!.id)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}
