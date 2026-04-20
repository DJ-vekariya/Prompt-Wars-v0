import { useNavigate } from "react-router-dom";
import { MapPin, Calendar, Ticket, ChevronRight } from "lucide-react";
import CrowdBadge from "@/components/CrowdBadge";
import VenueMap from "@/components/VenueMap";
import BottomNav from "@/components/BottomNav";
import EmergencySOS from "@/components/EmergencySOS";
import { useZones } from "@/hooks/useZones";
import { useSessions } from "@/hooks/useSessions";
import { useAuth } from "@/hooks/useAuth";

const AttendeeHome = () => {
  const navigate = useNavigate();
  const { zones } = useZones();
  const { sessions } = useSessions();
  const { user } = useAuth();
  const nextSession = sessions[0];
  const gates = zones.filter(z => z.type === "GATE" && z.isOpen);
  const displayName = user?.user_metadata?.display_name || "Attendee";

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="border-b border-border px-6 pb-6 pt-8">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Global Summit 2026</p>
        <h1 className="mt-1 font-display text-2xl font-light tracking-tight text-foreground">
          Good afternoon, {displayName}.
        </h1>
      </header>

      <div className="space-y-6 p-6">
        {nextSession && (
          <section className="relative overflow-hidden rounded-2xl border border-border bg-card">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
            <div className="relative p-6">
              <div className="mb-8 flex items-start justify-between">
                <span className="inline-flex items-center gap-2 rounded-md bg-foreground/10 px-3 py-1.5 text-sm font-medium tabular-nums text-foreground backdrop-blur">
                  <span className="size-1.5 animate-pulse rounded-full bg-primary" />
                  {new Date(nextSession.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} — {new Date(nextSession.endsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className="text-sm text-muted-foreground">Up Next</span>
              </div>
              <h2 className="font-display text-2xl font-light tracking-tight text-foreground lg:text-3xl">{nextSession.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{nextSession.speaker}</p>
              <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="text-sm font-medium text-foreground">{nextSession.dome}</p>
                </div>
                <button onClick={() => navigate("/map")} className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90">Navigate there</button>
              </div>
            </div>
          </section>
        )}

        <section className="grid grid-cols-3 gap-3">
          {[
            { icon: Ticket, label: "My Ticket", to: "/ticket" },
            { icon: Calendar, label: "Schedule", to: "/schedule" },
            { icon: MapPin, label: "Venue Map", to: "/map" },
          ].map(({ icon: Icon, label, to }) => (
            <button key={to} onClick={() => navigate(to)} className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent">
              <Icon className="size-5 text-primary" />
              <span className="text-xs font-medium text-foreground">{label}</span>
            </button>
          ))}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Gate Status</h3>
            <span className="text-xs text-muted-foreground">Live</span>
          </div>
          <div className="space-y-2 rounded-xl border border-border bg-card p-4">
            {gates.map((gate) => (
              <div key={gate.id} className="flex items-center justify-between py-2">
                <span className="text-sm text-foreground">{gate.name}</span>
                <CrowdBadge pct={gate.crowdPct} size="sm" />
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Venue Overview</h3>
            <button onClick={() => navigate("/map")} className="flex items-center gap-1 text-xs text-primary">Full Map <ChevronRight className="size-3" /></button>
          </div>
          <VenueMap zonesData={zones} onZoneClick={(id) => navigate(`/map?zone=${id}`)} />
        </section>
      </div>

      <BottomNav />
      <EmergencySOS />
    </div>
  );
};

export default AttendeeHome;
