import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/helpers";

export type DocTemplate = Tables<"document_templates">;

export function useDocTemplates() {
  const { company } = useAuth();
  return useQuery({
    queryKey: ["doc-templates", company?.id],
    enabled: !!company?.id,
    queryFn: async (): Promise<DocTemplate[]> => {
      const { data, error } = await supabase
        .from("document_templates").select("*")
        .eq("company_id", company!.id)
        .order("last_used_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useDocTemplate(id: string | undefined) {
  return useQuery({
    queryKey: ["doc-template", id],
    enabled: !!id,
    queryFn: async (): Promise<DocTemplate | null> => {
      const { data, error } = await supabase.from("document_templates").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateDocTemplate() {
  const { company } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (t: { name: string; base_type: string; intro_text?: string; outro_text?: string; items: unknown }) => {
      const { error } = await supabase.from("document_templates").insert({
        company_id: company!.id, name: t.name, base_type: t.base_type,
        intro_text: t.intro_text ?? null, outro_text: t.outro_text ?? null,
        items: t.items as never,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["doc-templates"] }),
  });
}

export function useDeleteDocTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("document_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["doc-templates"] }),
  });
}
