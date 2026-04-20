import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Users, Clock, Check } from "lucide-react";
import CrowdBadge from "@/components/CrowdBadge";
import BottomNav from "@/components/BottomNav";
import EmergencySOS from "@/components/EmergencySOS";
import { useSessions } from "@/hooks/useSessions";
import { useZones } from "@/hooks/useZones";
import { useRegistrations } from "@/hooks/useRegistrations";
import { toast } from "@/hooks/use-toast";

const SessionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { sessions } = useSessions();
  const { zones } = useZones();
  const { isRegistered, register, unregister } = useRegistrations();
  const session = sessions.find(s => s.id === id);

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Session not found</p>
      </div>
    );
  }

  const dome = zones.find(z => z.id === session.domeId);
  const startTime = new Date(session.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const endTime = new Date(session.endsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="border-b border-border px-6 pb-6 pt-8">
        <button onClick={() => navigate("/schedule")} className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowLeft className="size-4" /> Schedule
        </button>
        <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-medium text-primary">{session.track}</span>
        <h1 className="mt-3 font-display text-2xl font-light tracking-tight text-foreground">{session.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{session.speaker}</p>
      </header>

      <div className="space-y-6 p-6">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <Clock className="mb-2 size-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Time</p>
            <p className="text-sm font-medium tabular-nums text-foreground">{startTime} — {endTime}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <MapPin className="mb-2 size-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Location</p>
            <p className="text-sm font-medium text-foreground">{session.dome}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <Users className="mb-2 size-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Registered</p>
            <p className="text-sm font-medium text-foreground">{session.registered.toLocaleString()}</p>
          </div>
        </div>

        {dome && (
          <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
            <div>
              <p className="text-xs text-muted-foreground">Venue Crowd Level</p>
              <p className="text-sm font-medium text-foreground">{dome.name}</p>
            </div>
            <CrowdBadge pct={dome.crowdPct} />
          </div>
        )}

        <div>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">About</h3>
          <p className="text-sm leading-relaxed text-foreground/80">{session.description}</p>
        </div>

        {(() => {
          const going = isRegistered(session.id);
          const ended = new Date(session.endsAt).getTime() < Date.now();
          const full = session.registered >= session.capacity;
          const disabled = !going && (ended || full);
          const handleToggle = async () => {
            if (going) {
              const { error } = await unregister(session.id);
              if (error) toast({ title: "Couldn't unregister", description: error.message, variant: "destructive" });
              else toast({ title: "Removed from your schedule", description: session.title });
            } else {
              const { error } = await register(session.id);
              if (error) toast({ title: "Registration failed", description: error.message, variant: "destructive" });
              else toast({ title: "Added to your schedule", description: session.title });
            }
          };
          return (
            <button
              onClick={() => !disabled && handleToggle()}
              disabled={disabled}
              className={`flex w-full items-center justify-center gap-2 rounded-lg py-3 text-center text-sm font-medium transition-colors ${
                going
                  ? "bg-crowd-green/20 text-crowd-green hover:bg-crowd-green/30"
                  : disabled
                    ? "cursor-not-allowed bg-secondary text-muted-foreground"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              {going ? (<><Check className="size-4" /> Going — tap to cancel</>) : ended ? "Session ended" : full ? "Session full" : "Register for this session"}
            </button>
          );
        })()}

        <button onClick={() => navigate(`/map?zone=${session.domeId}`)} className="w-full rounded-lg bg-foreground py-3 text-center text-sm font-medium text-background transition-colors hover:bg-foreground/90">
          Navigate to {session.dome}
        </button>
      </div>

      <BottomNav />
      <EmergencySOS />
    </div>
  );
};

export default SessionDetail;
