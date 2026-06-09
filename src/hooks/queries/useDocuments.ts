import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/helpers";

export type DocumentRow = Tables<"documents"> & {
  customer?: { first_name: string | null; last_name: string | null; company_name: string | null; customer_number: string | null } | null;
};
export type DocumentItem = Tables<"document_items">;

const DOC_SELECT = "*, customer:customer_id(first_name,last_name,company_name,customer_number)";

export function useDocuments(baseTypes?: string[]) {
  const { company } = useAuth();
  return useQuery({
    queryKey: ["documents", company?.id, baseTypes?.join(",") ?? "all"],
    enabled: !!company?.id,
    queryFn: async (): Promise<DocumentRow[]> => {
      let q = supabase.from("documents").select(DOC_SELECT).eq("company_id", company!.id).eq("is_deleted", false);
      if (baseTypes?.length) q = q.in("base_type", baseTypes);
      const { data, error } = await q.order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as DocumentRow[];
    },
  });
}

export function useDocument(id: string | undefined) {
  return useQuery({
    queryKey: ["document", id],
    enabled: !!id,
    queryFn: async () => {
      const { data: doc, error } = await supabase.from("documents").select(DOC_SELECT).eq("id", id!).maybeSingle();
      if (error) throw error;
      const { data: items } = await supabase.from("document_items").select("*").eq("document_id", id!).order("sort_order");
      return { doc: doc as unknown as DocumentRow | null, items: (items ?? []) as DocumentItem[] };
    },
  });
}

export interface SaveItem {
  kind: string; article_id?: string | null; service_id?: string | null;
  name?: string; description?: string; quantity?: number; unit?: string;
  unit_price?: number; purchase_price?: number; discount_percent?: number;
  vat_rate?: number; time_minutes?: number;
}
export interface SavePayload {
  id?: string; base_type: string; doc_type_id?: string | null;
  customer_id?: string | null; contact_person_id?: string | null; project_id?: string | null;
  folder_id?: string | null; subject?: string; name?: string;
  doc_date?: string; due_date?: string | null; service_date?: string | null;
  intro_text?: string; outro_text?: string; discount_percent?: number; discount_amount?: number;
  reverse_charge?: boolean; items: SaveItem[];
}

export function useSaveDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SavePayload): Promise<string> => {
      const { data, error } = await supabase.rpc("save_document", { payload: payload as unknown as never });
      if (error) throw error;
      return data as string;
    },
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      qc.invalidateQueries({ queryKey: ["document", id] });
    },
  });
}

export function useFinalizeDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<string> => {
      const { data, error } = await supabase.rpc("finalize_document", { p_doc: id });
      if (error) throw error;
      return data as string;
    },
    onSuccess: (_n, id) => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      qc.invalidateQueries({ queryKey: ["document", id] });
    },
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("documents").update({ is_deleted: true, status: "geloescht" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
  });
}

// Katalogsuche für den Editor (Artikel + Leistungen)
export function useCatalogSearch(term: string) {
  const { company } = useAuth();
  return useQuery({
    queryKey: ["catalog-search", company?.id, term],
    enabled: !!company?.id,
    queryFn: async () => {
      const like = `%${term}%`;
      const [a, s] = await Promise.all([
        supabase.from("articles").select("id,name,article_number,unit,sale_price,purchase_price,vat_rate")
          .eq("company_id", company!.id).or(term ? `name.ilike.${like},article_number.ilike.${like}` : "name.not.is.null").limit(20),
        supabase.from("services").select("id,name,service_number,unit,price,vat_rate,time_minutes")
          .eq("company_id", company!.id).or(term ? `name.ilike.${like},service_number.ilike.${like}` : "name.not.is.null").limit(20),
      ]);
      return {
        articles: a.data ?? [],
        services: s.data ?? [],
      };
    },
  });
}
