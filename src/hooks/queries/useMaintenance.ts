import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables, TablesInsert } from "@/integrations/supabase/helpers";

export type MaintenanceContract = Tables<"maintenance_contracts"> & {
  customer?: { first_name: string | null; last_name: string | null; company_name: string | null } | null;
  assignee?: { first_name: string | null; last_name: string | null } | null;
};

const MC_SELECT =
  "*, customer:customer_id(first_name,last_name,company_name), assignee:assigned_to(first_name,last_name)";

export function useMaintenanceContracts() {
  const { company } = useAuth();
  return useQuery({
    queryKey: ["maintenance_contracts", company?.id],
    enabled: !!company?.id,
    queryFn: async (): Promise<MaintenanceContract[]> => {
      const { data, error } = await supabase
        .from("maintenance_contracts")
        .select(MC_SELECT)
        .eq("company_id", company!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as MaintenanceContract[];
    },
  });
}

// Mitarbeiter (Profile) des aktuellen Mandanten für das Zuweisungs-Select.
export function useTeamMembers() {
  const { company } = useAuth();
  return useQuery({
    queryKey: ["profiles", company?.id],
    enabled: !!company?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,first_name,last_name")
        .eq("company_id", company!.id)
        .eq("is_active", true);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertMaintenanceContract() {
  const { company } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Tables<"maintenance_contracts">> & { id?: string }) => {
      const body = { ...payload, company_id: company!.id } as TablesInsert<"maintenance_contracts">;
      if (payload.id) {
        const { data, error } = await supabase
          .from("maintenance_contracts").update(body).eq("id", payload.id).select().single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase
        .from("maintenance_contracts").insert(body).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["maintenance_contracts"] });
      qc.invalidateQueries({ queryKey: ["count", "maintenance_contracts"] });
    },
  });
}

export function useDeleteMaintenanceContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("maintenance_contracts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["maintenance_contracts"] }),
  });
}
