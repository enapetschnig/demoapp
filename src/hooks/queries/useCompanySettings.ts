import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { TablesUpdate } from "@/integrations/supabase/helpers";

export function useUpdateCompany() {
  const { company, refreshCompany } = useAuth();
  return useMutation({
    mutationFn: async (patch: TablesUpdate<"companies">) => {
      const { error } = await supabase.from("companies").update(patch).eq("id", company!.id);
      if (error) throw error;
    },
    onSuccess: () => refreshCompany(),
  });
}

export function useUploadLogo() {
  const { company, refreshCompany } = useAuth();
  return useMutation({
    mutationFn: async (file: File) => {
      const ext = file.name.split(".").pop() ?? "png";
      const path = `${company!.id}/logo-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("company-assets").upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("company-assets").getPublicUrl(path);
      const { error: upErr } = await supabase.from("companies").update({ logo_url: data.publicUrl }).eq("id", company!.id);
      if (upErr) throw upErr;
      return data.publicUrl;
    },
    onSuccess: () => refreshCompany(),
  });
}
