import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export default function Profil() {
  const { profile, refresh } = useAuth();
  const [form, setForm] = useState({ first_name: "", last_name: "", phone: "", position: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) setForm({
      first_name: profile.first_name ?? "", last_name: profile.last_name ?? "",
      phone: profile.phone ?? "", position: profile.position ?? "",
    });
  }, [profile]);

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update(form).eq("id", profile.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    await refresh();
    toast.success("Profil gespeichert");
  };

  return (
    <div>
      <PageHeader title="Persönliche Daten" subtitle="Ihr Mitarbeiterprofil"
        actions={<Button onClick={save} disabled={saving}>Speichern</Button>} />
      <Card className="max-w-2xl p-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5"><Label>Vorname</Label><Input value={form.first_name} onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))} /></div>
          <div className="space-y-1.5"><Label>Nachname</Label><Input value={form.last_name} onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))} /></div>
          <div className="space-y-1.5"><Label>E-Mail</Label><Input value={profile?.email ?? ""} disabled /></div>
          <div className="space-y-1.5"><Label>Telefon</Label><Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></div>
          <div className="space-y-1.5"><Label>Position</Label><Input value={form.position} onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))} /></div>
          <div className="space-y-1.5"><Label>Rolle</Label><Input value={profile?.role ?? ""} disabled /></div>
        </div>
      </Card>
    </div>
  );
}
