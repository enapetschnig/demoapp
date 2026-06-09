import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables, TablesInsert } from "@/integrations/supabase/helpers";

export type Contact = Tables<"contacts">;

export function useContacts() {
  const { company } = useAuth();
  return useQuery({
    queryKey: ["contacts", company?.id],
    enabled: !!company?.id,
    queryFn: async (): Promise<Contact[]> => {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("company_id", company!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useContact(id: string | undefined) {
  const { company } = useAuth();
  return useQuery({
    queryKey: ["contact", id],
    enabled: !!id && !!company?.id,
    queryFn: async (): Promise<Contact | null> => {
      const { data, error } = await supabase.from("contacts").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertContact() {
  const { company } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Contact> & { id?: string }) => {
      const body = { ...payload, company_id: company!.id } as TablesInsert<"contacts">;
      if (payload.id) {
        const { data, error } = await supabase.from("contacts").update(body).eq("id", payload.id).select().single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase.from("contacts").insert(body).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
      qc.invalidateQueries({ queryKey: ["count", "contacts"] });
    },
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contacts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contacts"] }),
  });
}
