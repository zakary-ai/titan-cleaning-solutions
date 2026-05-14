import { useEffect, useState, createContext, useContext, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "supervisor" | "client";

type AuthCtx = {
  session: Session | null;
  user: User | null;
  role: AppRole | null;
  profile: { full_name: string; email: string; organization_name: string | null } | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [profile, setProfile] = useState<AuthCtx["profile"]>(null);
  const [loading, setLoading] = useState(true);

  const loadRoleAndProfile = async (uid: string) => {
    const [{ data: roleRow, error: roleError }, { data: profileRow, error: profileError }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", uid).maybeSingle(),
      supabase.from("profiles").select("full_name,email,organization_name").eq("id", uid).maybeSingle(),
    ]);
    if (roleError) throw roleError;
    if (profileError) throw profileError;
    setRole((roleRow?.role as AppRole) ?? null);
    setProfile(profileRow ?? null);
  };

  useEffect(() => {
    let active = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      if (active) setSession(s);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (active) setSession(data.session);
    }).catch((error) => {
      console.error(error);
      if (active) setLoading(false);
    });

    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    let active = true;

    if (!session?.user) {
      setRole(null);
      setProfile(null);
      setLoading(false);
      return () => { active = false; };
    }

    setLoading(true);
    loadRoleAndProfile(session.user.id)
      .catch((error) => {
        console.error(error);
        if (active) {
          setRole(null);
          setProfile(null);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [session?.user?.id]);

  const value: AuthCtx = {
    session,
    user: session?.user ?? null,
    role,
    profile,
    loading,
    signOut: async () => { await supabase.auth.signOut(); },
    refresh: async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) await loadRoleAndProfile(data.session.user.id);
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}
