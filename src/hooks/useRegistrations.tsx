import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface RegistrationsContextType {
  registeredIds: Set<string>;
  loading: boolean;
  isRegistered: (sessionId: string) => boolean;
  register: (sessionId: string) => Promise<{ error: Error | null }>;
  unregister: (sessionId: string) => Promise<{ error: Error | null }>;
  refresh: () => Promise<void>;
}

const RegistrationsContext = createContext<RegistrationsContextType | undefined>(undefined);

export const RegistrationsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setRegisteredIds(new Set());
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("registrations")
      .select("session_id")
      .eq("user_id", user.id);
    if (!error && data) {
      setRegisteredIds(new Set(data.map((r: { session_id: string }) => r.session_id)));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [refresh]);

  const register = useCallback(async (sessionId: string) => {
    if (!user) return { error: new Error("Not signed in") };
    if (registeredIds.has(sessionId)) return { error: null };
    const { error } = await supabase
      .from("registrations")
      .insert({ session_id: sessionId, user_id: user.id });
    if (error) return { error: new Error(error.message) };
    setRegisteredIds(prev => new Set(prev).add(sessionId));
    return { error: null };
  }, [user, registeredIds]);

  const unregister = useCallback(async (sessionId: string) => {
    if (!user) return { error: new Error("Not signed in") };
    const { error } = await supabase
      .from("registrations")
      .delete()
      .eq("session_id", sessionId)
      .eq("user_id", user.id);
    if (error) return { error: new Error(error.message) };
    setRegisteredIds(prev => {
      const next = new Set(prev);
      next.delete(sessionId);
      return next;
    });
    return { error: null };
  }, [user]);

  const isRegistered = useCallback((sessionId: string) => registeredIds.has(sessionId), [registeredIds]);

  return (
    <RegistrationsContext.Provider value={{ registeredIds, loading, isRegistered, register, unregister, refresh }}>
      {children}
    </RegistrationsContext.Provider>
  );
};

export const useRegistrations = () => {
  const ctx = useContext(RegistrationsContext);
  if (!ctx) throw new Error("useRegistrations must be used within RegistrationsProvider");
  return ctx;
};
