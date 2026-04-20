import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sessions as mockSessions, type Session } from "@/lib/mock-data";

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>(mockSessions);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase.from("sessions").select("*").order("starts_at");
      if (!error && data && data.length > 0) {
        setSessions(data.map((s: any) => ({
          id: s.id,
          title: s.title,
          speaker: s.speaker,
          dome: s.dome,
          domeId: s.dome_id,
          startsAt: s.starts_at,
          endsAt: s.ends_at,
          track: s.track as Session["track"],
          capacity: s.capacity,
          registered: s.registered,
          description: s.description,
        })));
      }
      setLoading(false);
    };
    fetch();
  }, []);

  return { sessions, loading };
}
