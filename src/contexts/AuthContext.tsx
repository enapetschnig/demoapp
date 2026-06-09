import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { applyPrimaryColor } from "@/lib/theme";
import type { Tables } from "@/integrations/supabase/helpers";

type Profile = Tables<"profiles">;
type Company = Tables<"companies">;

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  company: Company | null;
  loading: boolean;
  refresh: () => Promise<void>;
  refreshCompany: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCompany = useCallback(async (companyId: string) => {
    const { data } = await supabase.from("companies").select("*").eq("id", companyId).maybeSingle();
    if (data) {
      setCompany(data);
      applyPrimaryColor(data.primary_color);
    }
  }, []);

  const loadProfile = useCallback(async (userId: string) => {
    let { data: prof } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();

    // Noch keinem Mandanten zugeordnet → Mandant samt Standarddaten anlegen.
    if (prof && !prof.company_id) {
      await supabase.rpc("bootstrap_company", { p_name: "Mein Betrieb" });
      const res = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
      prof = res.data;
    }
    setProfile(prof ?? null);
    if (prof?.company_id) await loadCompany(prof.company_id);
  }, [loadCompany]);

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
    if (data.session?.user) await loadProfile(data.session.user.id);
  }, [loadProfile]);

  const refreshCompany = useCallback(async () => {
    if (profile?.company_id) await loadCompany(profile.company_id);
  }, [profile?.company_id, loadCompany]);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session?.user) await loadProfile(data.session.user.id);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        loadProfile(newSession.user.id);
      } else {
        setProfile(null);
        setCompany(null);
      }
    });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setCompany(null);
  }, []);

  return (
    <AuthContext.Provider value={{ session, profile, company, loading, refresh, refreshCompany, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth muss innerhalb von AuthProvider verwendet werden");
  return ctx;
}
