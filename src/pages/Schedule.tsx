import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import CrowdBadge from "@/components/CrowdBadge";
import BottomNav from "@/components/BottomNav";
import EmergencySOS from "@/components/EmergencySOS";
import { useSessions } from "@/hooks/useSessions";
import { useZones } from "@/hooks/useZones";
import { useRegistrations } from "@/hooks/useRegistrations";

const trackColors: Record<string, string> = {
  KEYNOTE: "bg-primary/20 text-primary",
  WORKSHOP: "bg-crowd-green/20 text-crowd-green",
  PANEL: "bg-crowd-amber/20 text-crowd-amber",
  DEMO: "bg-blue-500/20 text-blue-400",
};

const Schedule = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<string>("ALL");
  const { sessions } = useSessions();
  const { zones } = useZones();
  const { isRegistered } = useRegistrations();

  const filtered =
    filter === "ALL"
      ? sessions
      : filter === "MINE"
        ? sessions.filter(s => isRegistered(s.id))
        : sessions.filter(s => s.track === filter);

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="border-b border-border px-6 pb-4 pt-8">
        <button onClick={() => navigate("/home")} className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowLeft className="size-4" /> Back
        </button>
        <h1 className="font-display text-2xl font-light tracking-tight text-foreground">Schedule</h1>
      </header>

      <div className="flex gap-2 overflow-x-auto px-6 py-4">
        {["ALL", "MINE", "KEYNOTE", "WORKSHOP", "PANEL", "DEMO"].map((track) => (
          <button
            key={track}
            onClick={() => setFilter(track)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${filter === track ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
          >
            {track === "ALL" ? "All Sessions" : track === "MINE" ? "My Sessions" : track}
          </button>
        ))}
      </div>

      <div className="space-y-3 px-6">
        {filter === "MINE" && filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">You haven't registered for any sessions yet.</p>
            <p className="mt-1 text-xs text-muted-foreground">Tap a dome on the map to see what's happening and register.</p>
          </div>
        )}
        {filtered.map((session) => {
          const dome = zones.find(z => z.id === session.domeId);
          const startTime = new Date(session.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          const endTime = new Date(session.endsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          const going = isRegistered(session.id);
          return (
            <button key={session.id} onClick={() => navigate(`/schedule/${session.id}`)} className={`w-full rounded-xl border bg-card p-5 text-left transition-colors hover:bg-accent ${going ? "border-crowd-green/40" : "border-border"}`}>
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${trackColors[session.track]}`}>{session.track}</span>
                <div className="flex items-center gap-2">
                  {going && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-crowd-green/20 px-2 py-0.5 text-[10px] font-semibold text-crowd-green">
                      <Check className="size-3" /> Going
                    </span>
                  )}
                  <span className="text-xs tabular-nums text-muted-foreground">{startTime} — {endTime}</span>
                </div>
              </div>
              <h3 className="font-display text-lg font-medium text-foreground">{session.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{session.speaker}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{session.dome}</span>
                {dome && <CrowdBadge pct={dome.crowdPct} size="sm" />}
              </div>
            </button>
          );
        })}
      </div>

      <BottomNav />
      <EmergencySOS />
    </div>
  );
};

export default Schedule;
