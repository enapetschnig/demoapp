import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables, TablesInsert } from "@/integrations/supabase/helpers";

export type Order = Tables<"orders">;

export function useOrders() {
  const { company } = useAuth();
  return useQuery({
    queryKey: ["orders", company?.id],
    enabled: !!company?.id,
    queryFn: async (): Promise<Order[]> => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("company_id", company!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertOrder() {
  const { company } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Order> & { id?: string }) => {
      if (payload.id) {
        const body = { ...payload, company_id: company!.id } as TablesInsert<"orders">;
        const { data, error } = await supabase
          .from("orders")
          .update(body)
          .eq("id", payload.id)
          .eq("company_id", company!.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }

      // Neue Auftragsnummer beim Anlegen erzeugen.
      const { data: number, error: numError } = await supabase.rpc("next_prefixed_number", {
        p_company: company!.id,
        p_table: "orders",
        p_col: "order_number",
        p_prefix: "AUF-",
        p_start: 1,
      });
      if (numError) throw numError;

      const body = {
        ...payload,
        company_id: company!.id,
        order_number: number,
      } as TablesInsert<"orders">;
      const { data, error } = await supabase.from("orders").insert(body).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["count", "orders"] });
    },
  });
}
