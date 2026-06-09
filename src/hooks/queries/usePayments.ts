import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables, TablesInsert } from "@/integrations/supabase/helpers";

export const INVOICE_TYPES = ["rechnung", "rechnung_13b", "gutschrift", "stornorechnung"];

export type InvoiceDocument = Tables<"documents"> & {
  customer?: {
    first_name: string | null;
    last_name: string | null;
    company_name: string | null;
    customer_number: string | null;
  } | null;
};

const DOC_SELECT =
  "*, customer:customer_id(first_name,last_name,company_name,customer_number)";

export function useInvoiceDocuments() {
  const { company } = useAuth();
  return useQuery({
    queryKey: ["invoice-documents", company?.id],
    enabled: !!company?.id,
    queryFn: async (): Promise<InvoiceDocument[]> => {
      const { data, error } = await supabase
        .from("documents")
        .select(DOC_SELECT)
        .eq("company_id", company!.id)
        .eq("is_deleted", false)
        .in("base_type", INVOICE_TYPES)
        .order("doc_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as InvoiceDocument[];
    },
  });
}

export interface AddPaymentInput {
  document_id: string;
  amount: number;
  paid_at: string;
  method?: string | null;
  note?: string | null;
}

export function useAddPayment() {
  const { company } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AddPaymentInput) => {
      const body: TablesInsert<"payments"> = {
        company_id: company!.id,
        document_id: input.document_id,
        amount: input.amount,
        paid_at: input.paid_at,
        method: input.method ?? null,
        note: input.note ?? null,
      };
      const { data, error } = await supabase
        .from("payments")
        .insert(body)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // open_amount/payment_status werden per DB-Trigger aktualisiert -> Liste neu laden
      qc.invalidateQueries({ queryKey: ["invoice-documents"] });
      qc.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}
