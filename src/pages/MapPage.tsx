import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, X, Navigation, Search, ArrowRight } from "lucide-react";
import VenueMap from "@/components/VenueMap";
import ZoneDetailView from "@/components/ZoneDetailView";
import CrowdBadge from "@/components/CrowdBadge";
import BottomNav from "@/components/BottomNav";
import EmergencySOS from "@/components/EmergencySOS";
import { useZones } from "@/hooks/useZones";
import { useSessions } from "@/hooks/useSessions";
import { buildRoute } from "@/lib/route";

const USER_ZONE_ID = "zone-gate-2";

const MapPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialZone = searchParams.get("zone");
  const [zoomedZoneId, setZoomedZoneId] = useState<string | null>(initialZone);
  const [search, setSearch] = useState("");
  const { zones } = useZones();
  const { sessions } = useSessions();
  const detailRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);

  const zone = zones.find(z => z.id === zoomedZoneId);
  const userZone = zones.find(z => z.id === USER_ZONE_ID);

  const matches = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return zones.filter(z => z.name.toLowerCase().includes(q)).slice(0, 6);
  }, [search, zones]);

  // Road-following route info (mirrors VenueMap)
  const route = useMemo(() => {
    if (!zone || !userZone) return null;
    return buildRoute({ x: userZone.cx, y: userZone.cy }, { x: zone.cx, y: zone.cy });
  }, [zone, userZone]);

  // Auto-scroll detail card into view when a zone is selected
  useEffect(() => {
    if (zoomedZoneId && detailRef.current) {
      detailRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [zoomedZoneId]);

  const handleZoneClick = (id: string) => {
    if (zoomedZoneId === id) {
      handleReset();
    } else {
      setZoomedZoneId(id);
      setSearchParams({ zone: id });
      setSearch("");
    }
  };

  const handleReset = () => {
    setZoomedZoneId(null);
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="border-b border-border px-6 pb-4 pt-8">
        <button onClick={() => navigate("/home")} className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowLeft className="size-4" /> Back
        </button>
        <h1 className="font-display text-2xl font-light tracking-tight text-foreground">Venue Map</h1>
        <p className="mt-1 text-xs text-muted-foreground">Search a zone or tap on the map</p>
      </header>

      <div className="p-6">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search zone (e.g. Main Dome)"
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-accent">
              <X className="size-3.5" />
            </button>
          )}
          {matches.length > 0 && (
            <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-auto rounded-xl border border-border bg-card shadow-lg">
              {matches.map(m => (
                <li key={m.id}>
                  <button
                    onClick={() => handleZoneClick(m.id)}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-accent"
                  >
                    <span className="truncate">{m.name}</span>
                    <span className="shrink-0 text-[10px] uppercase text-muted-foreground">{m.type}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div ref={mapRef} className="relative">
          <VenueMap
            zonesData={zones}
            highlightZoneId={zoomedZoneId || undefined}
            zoomedZoneId={zoomedZoneId}
            onZoneClick={handleZoneClick}
            showUserLocation={true}
            userZoneId={USER_ZONE_ID}
            routeTargetId={zoomedZoneId}
          />

          {zoomedZoneId && (
            <button
              onClick={handleReset}
              className="absolute right-4 top-4 z-10 flex items-center gap-1.5 rounded-full bg-background/95 px-3 py-2 text-xs font-medium text-foreground shadow-lg ring-1 ring-border backdrop-blur hover:bg-accent"
            >
              <X className="size-3.5" /> Reset view
            </button>
          )}
        </div>

        {zone && (
          <div ref={detailRef} className="mt-6 animate-fade-in scroll-mt-4">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-2xl">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Inside view</p>
                  <h2 className="font-display text-2xl font-medium text-foreground">{zone.name}</h2>
                  {route && zone.id !== USER_ZONE_ID && (
                    <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-[hsl(280,85%,58%)]">
                      <Navigation className="size-3" /> ~{route.etaMin} min walk from you
                    </p>
                  )}
                </div>
                <button
                  onClick={handleReset}
                  className="rounded-full p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground"
                  aria-label="Close detail view"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="mb-4 grid grid-cols-3 gap-3 rounded-xl bg-background/50 p-3">
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Type</p>
                  <p className="text-sm font-semibold text-foreground">{zone.type}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Capacity</p>
                  <p className="text-sm font-semibold text-foreground">{zone.capacity.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Crowd</p>
                  <div className="flex justify-center"><CrowdBadge pct={zone.crowdPct} size="sm" /></div>
                </div>
              </div>

              <div className="mb-4 overflow-hidden rounded-xl border border-border">
                <ZoneDetailView zone={zone} sessions={sessions} />
              </div>

              {route && route.steps.length > 0 && zone.id !== USER_ZONE_ID && (
                <div className="mb-4 rounded-xl border border-border bg-background/50 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Walking directions
                    </p>
                    <span className="text-[10px] font-medium text-[hsl(280,85%,58%)]">
                      ~{route.etaMin} min
                    </span>
                  </div>
                  <ol className="space-y-1.5">
                    {route.steps.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                        <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-[hsl(280,85%,58%)]/15 text-[9px] font-bold text-[hsl(280,85%,58%)]">
                          {i + 1}
                        </span>
                        <span className="flex-1">
                          <ArrowRight className="mr-1 inline size-3 text-muted-foreground" />
                          {s}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className={`text-xs font-medium ${zone.isOpen ? "text-crowd-green" : "text-crowd-red"}`}>
                  {zone.isOpen ? "● Open now" : "● Currently closed"}
                </span>
                <button
                  onClick={() => {
                    mapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                    if (route) {
                      toast({
                        title: `Navigating to ${zone.name}`,
                        description: `~${route.etaMin} min walk · ${route.steps.length} steps`,
                      });
                    }
                  }}
                  className="flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-xs font-medium text-background hover:opacity-90"
                >
                  <Navigation className="size-3.5" /> Navigate here
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
      <EmergencySOS />
    </div>
  );
};

export default MapPage;
