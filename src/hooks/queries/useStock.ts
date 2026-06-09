import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables, TablesInsert } from "@/integrations/supabase/helpers";

export type StockItem = Tables<"stock_items">;
export type StockMovement = Tables<"stock_movements">;

export function useStockItems() {
  const { company } = useAuth();
  return useQuery({
    queryKey: ["stock_items", company?.id],
    enabled: !!company?.id,
    queryFn: async (): Promise<StockItem[]> => {
      const { data, error } = await supabase
        .from("stock_items")
        .select("*")
        .eq("company_id", company!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertStockItem() {
  const { company } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<StockItem> & { id?: string }) => {
      const body = { ...payload, company_id: company!.id } as TablesInsert<"stock_items">;
      if (payload.id) {
        const { data, error } = await supabase
          .from("stock_items")
          .update(body)
          .eq("id", payload.id)
          .eq("company_id", company!.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase
        .from("stock_items")
        .insert(body)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stock_items"] });
    },
  });
}

export function useStockMovements(stockItemId?: string) {
  const { company } = useAuth();
  return useQuery({
    queryKey: ["stock_movements", company?.id, stockItemId ?? "all"],
    enabled: !!company?.id,
    queryFn: async (): Promise<StockMovement[]> => {
      let q = supabase
        .from("stock_movements")
        .select("*")
        .eq("company_id", company!.id);
      if (stockItemId) q = q.eq("stock_item_id", stockItemId);
      const { data, error } = await q.order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAddMovement() {
  const { company, profile } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      stock_item_id: string;
      type: "einbuchung" | "ausbuchung";
      quantity: number;
      note?: string | null;
    }) => {
      const body: TablesInsert<"stock_movements"> = {
        company_id: company!.id,
        created_by: profile?.id ?? null,
        stock_item_id: payload.stock_item_id,
        type: payload.type,
        quantity: payload.quantity,
        note: payload.note ?? null,
      };
      const { data, error } = await supabase
        .from("stock_movements")
        .insert(body)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Bestand wird per DB-Trigger aktualisiert -> beide Listen neu laden.
      qc.invalidateQueries({ queryKey: ["stock_movements"] });
      qc.invalidateQueries({ queryKey: ["stock_items"] });
    },
  });
}
