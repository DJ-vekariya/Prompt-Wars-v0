import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { incidents as mockIncidents, type Incident } from "@/lib/mock-data";

export function useIncidents() {
  const [incidents, setIncidents] = useState<Incident[]>(mockIncidents);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase.from("incidents").select("*").order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        setIncidents(data.map((i: any) => ({
          id: i.id,
          type: i.type as Incident["type"],
          zoneName: i.zone_name,
          zoneId: i.zone_id,
          status: i.status as Incident["status"],
          assignedTo: i.assigned_to ?? undefined,
          notes: i.notes ?? undefined,
          createdAt: i.created_at,
        })));
      }
      setLoading(false);
    };
    fetch();

    // Realtime
    const channelName = `incidents-${Math.random().toString(36).substring(7)}`;
    const channel = supabase
      .channel(channelName)
      .on("postgres_changes", { event: "*", schema: "public", table: "incidents" }, (payload) => {
        if (payload.eventType === "INSERT") {
          const i = payload.new as any;
          setIncidents(prev => [{
            id: i.id, type: i.type, zoneName: i.zone_name, zoneId: i.zone_id,
            status: i.status, assignedTo: i.assigned_to, notes: i.notes, createdAt: i.created_at,
          }, ...prev]);
        } else if (payload.eventType === "UPDATE") {
          const i = payload.new as any;
          setIncidents(prev => prev.map(inc => inc.id === i.id ? {
            ...inc, status: i.status, assignedTo: i.assigned_to, notes: i.notes,
          } : inc));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { incidents, setIncidents, loading };
}
