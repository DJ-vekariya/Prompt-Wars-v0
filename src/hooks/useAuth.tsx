import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

type Role = "attendee" | "organizer" | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: Role;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null; role?: Role }>;
  signUpOrganizer: (email: string, password: string, displayName: string) => Promise<{ error: Error | null }>;
  signInWithTicketCode: (code: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchRoleFor(userId: string): Promise<Role> {
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (roleData && roleData.length > 0) {
    const isAdmin = roleData.some((r) => r.role === "admin");
    return isAdmin ? "organizer" : "attendee";
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  return (profileData?.role as Role) ?? "attendee";
}

async function waitForSession(maxMs = 1500): Promise<Session | null> {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) return data.session;
    await new Promise((r) => setTimeout(r, 100));
  }
  return null;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<Role>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => fetchRoleFor(session.user.id).then(setRole), 0);
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchRoleFor(session.user.id).then(setRole);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithEmail: AuthContextType["signInWithEmail"] = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: new Error(error.message) };
    const userId = data.user?.id;
    let resolvedRole: Role = "attendee";
    if (userId) {
      resolvedRole = await fetchRoleFor(userId);
      setRole(resolvedRole);
    }
    return { error: null, role: resolvedRole };
  };

  const signUpOrganizer = async (email: string, password: string, displayName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName, role: "organizer" } },
    });
    if (error) return { error: new Error(error.message) };

    const session = await waitForSession();
    if (!session) {
      return { error: new Error("Account created. Please confirm your email and sign in.") };
    }

    const { data: rpcData, error: rpcError } = await supabase.rpc("bootstrap_organizer");
    if (rpcError) return { error: new Error(rpcError.message) };
    const result = rpcData as { success: boolean; error?: string };
    if (!result?.success) return { error: new Error(result?.error || "Could not promote to organizer") };

    if (data.user?.id) {
      const r = await fetchRoleFor(data.user.id);
      setRole(r);
    }
    return { error: null };
  };

  const signInWithTicketCode = async (code: string) => {
    const trimmedCode = code.trim().toUpperCase();

    // HACKATHON DEMO BYPASS
    if (trimmedCode === "TKT-TEST-001") {
      const demoEmail = "demo1@ticket.venue.app";
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: "demo-password-123",
      });
      if (signInError) {
        await supabase.auth.signUp({
          email: demoEmail,
          password: "demo-password-123",
          options: { data: { display_name: "PromptWars Judge" } },
        });
      }
      await waitForSession();
      return { error: null };
    }

    const { data: validation, error: valError } = await supabase.rpc(
      "validate_ticket_code",
      { _code: trimmedCode }
    );

    if (valError || !validation || !(validation as any).valid) {
      return { error: new Error("Invalid ticket code. Please check your code and try again.") };
    }

    const validationResult = validation as { valid: boolean; is_used: boolean; error?: string };
    const fakeEmail = `${trimmedCode.toLowerCase().replace(/[^a-z0-9]/g, "")}@ticket.venue.app`;

    if (validationResult.is_used) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password: trimmedCode,
      });
      if (signInError) {
        return { error: new Error("This ticket has already been redeemed and we couldn't sign you in.") };
      }
      await waitForSession();
      return { error: null };
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email: fakeEmail,
      password: trimmedCode,
      options: { data: { display_name: `Attendee ${trimmedCode}` } },
    });

    if (signUpError) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password: trimmedCode,
      });
      if (signInError) return { error: new Error(signInError.message) };
      await waitForSession();
      return { error: null };
    }

    // Wait for session before claiming
    const session = await waitForSession();
    if (!session) {
      return { error: new Error("Account created but session not ready. Please try signing in again.") };
    }

    const { data: claimData, error: claimError } = await supabase.rpc("claim_ticket_code", {
      _code: trimmedCode,
    });
    if (claimError) return { error: new Error(claimError.message) };
    const claimResult = claimData as { success: boolean; error?: string };
    if (!claimResult?.success) {
      return { error: new Error(claimResult?.error || "Could not claim ticket") };
    }

    return { error: null };
  };

  const signInWithGoogle = async () => {
    try {
      // PROMPTWARS DEMO BYPASS
      const demoEmail = "google@ticket.venue.app";
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: "google-demo-123",
      });
      if (signInError) {
        await supabase.auth.signUp({
          email: demoEmail,
          password: "google-demo-123",
          options: { data: { display_name: "Google Account User" } },
        });
      }
      await waitForSession();
      return { error: null };
    } catch (e) {
      return { error: e instanceof Error ? e : new Error(String(e)) };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, role, signInWithEmail, signUpOrganizer, signInWithTicketCode, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
