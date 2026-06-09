import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables, TablesInsert } from "@/integrations/supabase/helpers";

export type Article = Tables<"articles">;
export type Service = Tables<"services">;
export type SalesPrice = Tables<"sales_prices">;

/* ----------------------------- Artikel ----------------------------- */
export function useArticles() {
  const { company } = useAuth();
  return useQuery({
    queryKey: ["articles", company?.id],
    enabled: !!company?.id,
    queryFn: async (): Promise<Article[]> => {
      const { data, error } = await supabase.from("articles").select("*").eq("company_id", company!.id).order("article_number");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertArticle() {
  const { company } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Article> & { id?: string }) => {
      const body = { ...payload, company_id: company!.id } as TablesInsert<"articles">;
      const q = payload.id
        ? supabase.from("articles").update(body).eq("id", payload.id).select().single()
        : supabase.from("articles").insert(body).select().single();
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["articles"] }),
  });
}

export function useDeleteArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("articles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["articles"] }),
  });
}

/* ---------------------------- Leistungen ---------------------------- */
export function useServices() {
  const { company } = useAuth();
  return useQuery({
    queryKey: ["services", company?.id],
    enabled: !!company?.id,
    queryFn: async (): Promise<Service[]> => {
      const { data, error } = await supabase.from("services").select("*").eq("company_id", company!.id).order("service_number");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertService() {
  const { company } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Service> & { id?: string }) => {
      const body = { ...payload, company_id: company!.id } as TablesInsert<"services">;
      const q = payload.id
        ? supabase.from("services").update(body).eq("id", payload.id).select().single()
        : supabase.from("services").insert(body).select().single();
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["services"] }),
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("services").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["services"] }),
  });
}

/* -------------------------- Verkaufspreise -------------------------- */
export function useSalesPrices() {
  const { company } = useAuth();
  return useQuery({
    queryKey: ["sales_prices", company?.id],
    enabled: !!company?.id,
    queryFn: async (): Promise<SalesPrice[]> => {
      const { data, error } = await supabase.from("sales_prices").select("*").eq("company_id", company!.id).order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertSalesPrice() {
  const { company } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<SalesPrice> & { id?: string }) => {
      const body = { ...payload, company_id: company!.id } as TablesInsert<"sales_prices">;
      const q = payload.id
        ? supabase.from("sales_prices").update(body).eq("id", payload.id).select().single()
        : supabase.from("sales_prices").insert(body).select().single();
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sales_prices"] }),
  });
}

export function useDeleteSalesPrice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sales_prices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sales_prices"] }),
  });
}
