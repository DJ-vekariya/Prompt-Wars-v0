import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { zones as mockZones, type Zone } from "@/lib/mock-data";

export function useZones() {
  const [zones, setZones] = useState<Zone[]>(mockZones);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchZones = async () => {
      const { data, error } = await supabase.from("zones").select("*");
      if (!error && data && data.length > 0) {
        setZones(data.map((z: any) => ({
          id: z.id,
          name: z.name,
          type: z.type as Zone["type"],
          capacity: z.capacity,
          crowdPct: Number(z.crowd_pct),
          isOpen: z.is_open,
          cx: Number(z.cx),
          cy: Number(z.cy),
        })));
      }
      setLoading(false);
    };
    fetchZones();

    // Realtime updates
    const channelName = `zones-${Math.random().toString(36).substring(7)}`;
    const channel = supabase
      .channel(channelName)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "zones" }, (payload) => {
        const z = payload.new as any;
        setZones(prev => prev.map(zone =>
          zone.id === z.id
            ? { ...zone, crowdPct: Number(z.crowd_pct), isOpen: z.is_open }
            : zone
        ));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { zones, loading };
}
