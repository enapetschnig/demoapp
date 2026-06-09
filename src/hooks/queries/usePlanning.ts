import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables, TablesInsert } from "@/integrations/supabase/helpers";

export type Appointment = Tables<"appointments">;
export type AppointmentCategory = Tables<"appointment_categories">;
export type Resource = Tables<"resources">;

/* ---------------- Termine (appointments) ---------------- */

export function useAppointments(range?: { from: Date; to: Date }) {
  const { company } = useAuth();
  return useQuery({
    queryKey: ["appointments", company?.id, range?.from?.toISOString(), range?.to?.toISOString()],
    enabled: !!company?.id,
    queryFn: async (): Promise<Appointment[]> => {
      let q = supabase
        .from("appointments")
        .select("*")
        .eq("company_id", company!.id);
      if (range) {
        q = q.gte("start_at", range.from.toISOString()).lte("start_at", range.to.toISOString());
      }
      const { data, error } = await q.order("start_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertAppointment() {
  const { company } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Appointment> & { id?: string }) => {
      const body = { ...payload, company_id: company!.id } as TablesInsert<"appointments">;
      if (payload.id) {
        const { data, error } = await supabase
          .from("appointments")
          .update(body)
          .eq("id", payload.id)
          .eq("company_id", company!.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase.from("appointments").insert(body).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  });
}

export function useDeleteAppointment() {
  const { company } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", id)
        .eq("company_id", company!.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  });
}

/* ---------------- Kategorien (appointment_categories) ---------------- */

export function useAppointmentCategories() {
  const { company } = useAuth();
  return useQuery({
    queryKey: ["appointment_categories", company?.id],
    enabled: !!company?.id,
    queryFn: async (): Promise<AppointmentCategory[]> => {
      const { data, error } = await supabase
        .from("appointment_categories")
        .select("*")
        .eq("company_id", company!.id)
        .order("name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertAppointmentCategory() {
  const { company } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<AppointmentCategory> & { id?: string }) => {
      const body = { ...payload, company_id: company!.id } as TablesInsert<"appointment_categories">;
      if (payload.id) {
        const { data, error } = await supabase
          .from("appointment_categories")
          .update(body)
          .eq("id", payload.id)
          .eq("company_id", company!.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase
        .from("appointment_categories")
        .insert(body)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointment_categories"] }),
  });
}

export function useDeleteAppointmentCategory() {
  const { company } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("appointment_categories")
        .delete()
        .eq("id", id)
        .eq("company_id", company!.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointment_categories"] }),
  });
}

/* ---------------- Ressourcen (resources) ---------------- */

export function useResources() {
  const { company } = useAuth();
  return useQuery({
    queryKey: ["resources", company?.id],
    enabled: !!company?.id,
    queryFn: async (): Promise<Resource[]> => {
      const { data, error } = await supabase
        .from("resources")
        .select("*")
        .eq("company_id", company!.id)
        .order("name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertResource() {
  const { company } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Resource> & { id?: string }) => {
      const body = { ...payload, company_id: company!.id } as TablesInsert<"resources">;
      if (payload.id) {
        const { data, error } = await supabase
          .from("resources")
          .update(body)
          .eq("id", payload.id)
          .eq("company_id", company!.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase.from("resources").insert(body).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["resources"] }),
  });
}

export function useDeleteResource() {
  const { company } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("resources")
        .delete()
        .eq("id", id)
        .eq("company_id", company!.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["resources"] }),
  });
}
