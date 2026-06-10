import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables, TablesInsert } from "@/integrations/supabase/helpers";

export type Receipt = Tables<"receipts">;

export function useReceipts() {
  const { company } = useAuth();
  return useQuery({
    queryKey: ["receipts", company?.id],
    enabled: !!company?.id,
    queryFn: async (): Promise<Receipt[]> => {
      const { data, error } = await supabase
        .from("receipts")
        .select("*")
        .eq("company_id", company!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertReceipt() {
  const { company } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Receipt> & { id?: string }) => {
      // Offener Betrag konsistent aus Status + Brutto ableiten.
      const gross = Number(payload.gross_amount ?? 0);
      const open = payload.status === "bezahlt" ? 0 : gross;
      const body = { ...payload, company_id: company!.id, open_amount: open } as TablesInsert<"receipts">;
      if (payload.id) {
        const { data, error } = await supabase
          .from("receipts")
          .update(body)
          .eq("id", payload.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase.from("receipts").insert(body).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["receipts"] });
      qc.invalidateQueries({ queryKey: ["count", "receipts"] });
    },
  });
}
