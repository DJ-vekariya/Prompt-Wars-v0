import { Users, Clock, Check } from "lucide-react";
import type { Zone, Session } from "@/lib/mock-data";
import { toast } from "@/hooks/use-toast";
import { useRegistrations } from "@/hooks/useRegistrations";

interface ZoneDetailViewProps {
  zone: Zone;
  sessions?: Session[];
}

const ZoneDetailView = ({ zone, sessions = [] }: ZoneDetailViewProps) => {
  const filledRatio = Math.min(zone.crowdPct, 1);
  const { isRegistered, register, unregister } = useRegistrations();
  const liveSessions = (zone.type === "DOME" || zone.type === "STAGE")
    ? sessions.filter(s => s.domeId === zone.id)
    : [];

  const handleToggle = async (s: Session) => {
    if (isRegistered(s.id)) {
      const { error } = await unregister(s.id);
      if (error) {
        toast({ title: "Couldn't unregister", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Removed from your schedule", description: s.title });
      }
    } else {
      const { error } = await register(s.id);
      if (error) {
        toast({ title: "Registration failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Added to your schedule", description: s.title });
      }
    }
  };

  const renderSvg = () => {
    switch (zone.type) {
      case "DOME":
        return (
          <svg viewBox="0 0 400 400" className="w-full h-auto">
            <defs>
              <radialGradient id="dome-floor" cx="50%" cy="50%">
                <stop offset="0%" stopColor="hsl(43, 25%, 18%)" />
                <stop offset="100%" stopColor="hsl(240, 8%, 8%)" />
              </radialGradient>
            </defs>
            <rect width="400" height="400" fill="hsl(240, 10%, 5%)" rx="12" />
            <circle cx="200" cy="220" r="170" fill="url(#dome-floor)" stroke="hsl(43, 25%, 35%)" strokeWidth="2" />
            <rect x="130" y="60" width="140" height="40" rx="4" fill="hsl(43, 25%, 45%)" stroke="hsl(43, 35%, 60%)" strokeWidth="1.5" />
            <text x="200" y="85" textAnchor="middle" fontSize="11" fill="#fff" fontWeight="700">STAGE</text>
            {[120, 150, 180, 210].map((r, i) => {
              const seats = 24 + i * 6;
              const filledSeats = Math.floor(seats * filledRatio);
              return Array.from({ length: seats }).map((_, j) => {
                const angle = (Math.PI * 0.15) + (Math.PI * 0.7) * (j / (seats - 1));
                const x = 200 + r * Math.cos(angle + Math.PI);
                const y = 220 + r * Math.sin(angle + Math.PI) + 60;
                const filled = j < filledSeats;
                return (
                  <circle key={`seat-${i}-${j}`} cx={x} cy={y} r="3"
                    fill={filled ? (filledRatio > 0.8 ? "hsl(0, 70%, 55%)" : filledRatio > 0.5 ? "hsl(33, 85%, 55%)" : "hsl(158, 60%, 46%)") : "hsl(240, 5%, 25%)"} />
                );
              });
            })}
            <rect x="40" y="200" width="14" height="40" rx="2" fill="hsl(43, 25%, 50%)" />
            <text x="20" y="225" fontSize="9" fill="hsl(240, 5%, 70%)">EXIT</text>
            <rect x="346" y="200" width="14" height="40" rx="2" fill="hsl(43, 25%, 50%)" />
            <text x="365" y="225" fontSize="9" fill="hsl(240, 5%, 70%)">EXIT</text>
            <rect x="170" y="380" width="60" height="14" rx="2" fill="hsl(43, 25%, 50%)" />
            <text x="200" y="375" textAnchor="middle" fontSize="9" fill="hsl(240, 5%, 70%)">MAIN ENTRY</text>
            <rect x="60" y="320" width="40" height="30" rx="4" fill="hsl(240, 6%, 14%)" stroke="hsl(240, 5%, 30%)" />
            <text x="80" y="340" textAnchor="middle" fontSize="9" fill="hsl(240, 5%, 70%)">WC</text>
          </svg>
        );

      case "FOOD":
        return (
          <svg viewBox="0 0 400 400" className="w-full h-auto">
            <rect width="400" height="400" fill="hsl(240, 10%, 5%)" rx="12" />
            <rect x="40" y="40" width="320" height="50" rx="6" fill="hsl(43, 25%, 30%)" stroke="hsl(43, 35%, 50%)" strokeWidth="1.5" />
            {[0, 1, 2, 3, 4].map(i => (
              <g key={`stall-${i}`}>
                <rect x={50 + i * 62} y={50} width="50" height="30" rx="3" fill="hsl(240, 8%, 12%)" />
                <text x={75 + i * 62} y={70} textAnchor="middle" fontSize="9" fill="hsl(43, 25%, 70%)">Stall {i + 1}</text>
              </g>
            ))}
            <path d="M60,110 L340,110" stroke="hsl(33, 85%, 55%)" strokeWidth="3" strokeDasharray="6,4" opacity="0.5" />
            <text x="200" y="130" textAnchor="middle" fontSize="10" fill="hsl(240, 5%, 60%)">← Queue line →</text>
            {Array.from({ length: 12 }).map((_, i) => {
              const col = i % 4;
              const row = Math.floor(i / 4);
              const occupied = i / 12 < filledRatio;
              return (
                <g key={`table-${i}`} transform={`translate(${80 + col * 80}, ${190 + row * 70})`}>
                  <circle r="22" fill={occupied ? "hsl(43, 25%, 35%)" : "hsl(240, 6%, 15%)"} stroke="hsl(43, 25%, 45%)" strokeWidth="1" />
                  {[0, 1, 2, 3].map(s => {
                    const a = (s * Math.PI) / 2;
                    return <circle key={s} cx={Math.cos(a) * 30} cy={Math.sin(a) * 30} r="5" fill={occupied ? "hsl(33, 85%, 55%)" : "hsl(240, 5%, 25%)"} />;
                  })}
                </g>
              );
            })}
            <text x="200" y="395" textAnchor="middle" fontSize="9" fill="hsl(240, 5%, 60%)">Seating Area</text>
          </svg>
        );

      case "PARKING": {
        const totalSpots = 60;
        const occupied = Math.floor(totalSpots * filledRatio);
        return (
          <svg viewBox="0 0 400 400" className="w-full h-auto">
            <rect width="400" height="400" fill="hsl(240, 8%, 12%)" rx="12" />
            <line x1="0" y1="200" x2="400" y2="200" stroke="hsl(43, 25%, 50%)" strokeWidth="1" strokeDasharray="10,8" opacity="0.5" />
            {Array.from({ length: totalSpots }).map((_, i) => {
              const col = i % 10;
              const row = Math.floor(i / 10);
              const isOccupied = i < occupied;
              const x = 25 + col * 36;
              const y = 30 + row * 60;
              return (
                <g key={`spot-${i}`}>
                  <rect x={x} y={y} width="30" height="50" rx="2" fill="none" stroke="hsl(43, 25%, 45%)" strokeWidth="1" />
                  {isOccupied && <rect x={x + 3} y={y + 5} width="24" height="40" rx="3" fill={`hsl(${(i * 47) % 360}, 30%, 35%)`} stroke="hsl(240, 5%, 20%)" strokeWidth="1" />}
                </g>
              );
            })}
            <text x="200" y="395" textAnchor="middle" fontSize="10" fill="hsl(240, 5%, 70%)">{occupied} / {totalSpots} occupied</text>
          </svg>
        );
      }

      case "GATE":
        return (
          <svg viewBox="0 0 400 400" className="w-full h-auto">
            <rect width="400" height="400" fill="hsl(240, 10%, 5%)" rx="12" />
            <rect x="60" y="60" width="280" height="40" rx="4" fill="hsl(43, 25%, 35%)" stroke="hsl(43, 35%, 55%)" strokeWidth="2" />
            <text x="200" y="85" textAnchor="middle" fontSize="12" fill="#fff" fontWeight="700">ENTRY GATE</text>
            {[0, 1, 2, 3].map(i => (
              <g key={`turn-${i}`} transform={`translate(${100 + i * 70}, 140)`}>
                <rect width="40" height="60" rx="4" fill="hsl(240, 6%, 14%)" stroke="hsl(43, 25%, 50%)" strokeWidth="1.5" />
                <circle cx="20" cy="30" r="10" fill="none" stroke="hsl(43, 25%, 60%)" strokeWidth="2" />
                <line x1="20" y1="20" x2="20" y2="40" stroke="hsl(43, 25%, 60%)" strokeWidth="2" />
                <line x1="10" y1="30" x2="30" y2="30" stroke="hsl(43, 25%, 60%)" strokeWidth="2" />
              </g>
            ))}
            <rect x="100" y="230" width="200" height="40" rx="6" fill="hsl(0, 40%, 25%)" stroke="hsl(0, 70%, 55%)" strokeWidth="1.5" />
            <text x="200" y="255" textAnchor="middle" fontSize="11" fill="#fff" fontWeight="600">🛡 SECURITY CHECK</text>
            {[0, 1, 2, 3].map(i => {
              const queueLen = Math.floor(8 * filledRatio + (i % 2));
              return Array.from({ length: queueLen }).map((_, p) => (
                <circle key={`q-${i}-${p}`} cx={120 + i * 70} cy={310 + p * 12} r="4" fill="hsl(33, 85%, 55%)" />
              ));
            })}
            <text x="200" y="395" textAnchor="middle" fontSize="9" fill="hsl(240, 5%, 60%)">Queue lanes</text>
          </svg>
        );

      case "MEDICAL":
      case "SAFETY":
        return (
          <svg viewBox="0 0 400 400" className="w-full h-auto">
            <rect width="400" height="400" fill="hsl(240, 10%, 5%)" rx="12" />
            <rect x="60" y="40" width="280" height="50" rx="6" fill="hsl(0, 40%, 25%)" stroke="hsl(0, 70%, 55%)" strokeWidth="1.5" />
            <text x="200" y="70" textAnchor="middle" fontSize="12" fill="#fff" fontWeight="700">{zone.type === "MEDICAL" ? "🏥 RECEPTION" : "🚨 DISPATCH"}</text>
            {[0, 1, 2, 3, 4, 5].map(i => {
              const col = i % 3;
              const row = Math.floor(i / 3);
              return (
                <g key={`bed-${i}`} transform={`translate(${50 + col * 110}, ${130 + row * 100})`}>
                  <rect width="90" height="40" rx="4" fill="hsl(240, 6%, 16%)" stroke="hsl(43, 25%, 45%)" strokeWidth="1" />
                  <rect x="4" y="4" width="20" height="32" rx="2" fill="hsl(43, 25%, 30%)" />
                  <text x="45" y="25" textAnchor="middle" fontSize="9" fill="hsl(240, 5%, 70%)">{zone.type === "MEDICAL" ? `Bed ${i + 1}` : `Unit ${i + 1}`}</text>
                </g>
              );
            })}
            <g transform="translate(340,340)">
              <rect x="-12" y="-4" width="24" height="8" fill="hsl(0, 70%, 55%)" />
              <rect x="-4" y="-12" width="8" height="24" fill="hsl(0, 70%, 55%)" />
            </g>
          </svg>
        );

      case "STAGE":
        return (
          <svg viewBox="0 0 400 400" className="w-full h-auto">
            <rect width="400" height="400" fill="hsl(240, 10%, 5%)" rx="12" />
            <rect x="60" y="40" width="280" height="40" rx="4" fill="hsl(240, 6%, 18%)" stroke="hsl(43, 25%, 40%)" strokeDasharray="4,3" />
            <text x="200" y="65" textAnchor="middle" fontSize="10" fill="hsl(240, 5%, 60%)">BACKSTAGE</text>
            <rect x="60" y="100" width="280" height="80" rx="6" fill="hsl(43, 25%, 35%)" stroke="hsl(43, 45%, 60%)" strokeWidth="2" />
            <text x="200" y="148" textAnchor="middle" fontSize="14" fill="#fff" fontWeight="700">🎤 MAIN STAGE</text>
            <path d="M40,200 L360,200 L380,360 L20,360 Z" fill="hsl(240, 8%, 10%)" stroke="hsl(43, 25%, 35%)" strokeWidth="1.5" />
            {Array.from({ length: 60 }).map((_, i) => {
              const filled = i / 60 < filledRatio;
              const col = i % 12;
              const row = Math.floor(i / 12);
              return <circle key={`aud-${i}`} cx={50 + col * 28} cy={220 + row * 28} r="5"
                fill={filled ? (filledRatio > 0.8 ? "hsl(0, 70%, 55%)" : filledRatio > 0.5 ? "hsl(33, 85%, 55%)" : "hsl(158, 60%, 46%)") : "hsl(240, 5%, 22%)"} />;
            })}
            <rect x="170" y="370" width="60" height="20" rx="3" fill="hsl(43, 25%, 30%)" stroke="hsl(43, 35%, 55%)" />
            <text x="200" y="384" textAnchor="middle" fontSize="8" fill="#fff">SOUND DESK</text>
          </svg>
        );

      case "VIP":
        return (
          <svg viewBox="0 0 400 400" className="w-full h-auto">
            <rect width="400" height="400" fill="hsl(240, 10%, 5%)" rx="12" />
            <rect x="40" y="40" width="320" height="320" rx="16" fill="hsl(43, 25%, 12%)" stroke="hsl(43, 45%, 55%)" strokeWidth="2" />
            <text x="200" y="80" textAnchor="middle" fontSize="14" fill="hsl(43, 45%, 70%)" fontWeight="700">⭐ VIP LOUNGE</text>
            {[0, 1, 2, 3].map(i => {
              const positions = [{ x: 80, y: 130 }, { x: 240, y: 130 }, { x: 80, y: 260 }, { x: 240, y: 260 }];
              const p = positions[i];
              return (
                <g key={`sofa-${i}`} transform={`translate(${p.x},${p.y})`}>
                  <rect width="80" height="40" rx="8" fill="hsl(43, 25%, 28%)" stroke="hsl(43, 45%, 50%)" />
                  <rect x="5" y="5" width="20" height="30" rx="4" fill="hsl(43, 25%, 38%)" />
                  <rect x="55" y="5" width="20" height="30" rx="4" fill="hsl(43, 25%, 38%)" />
                </g>
              );
            })}
            <rect x="140" y="200" width="120" height="30" rx="4" fill="hsl(43, 25%, 35%)" stroke="hsl(43, 45%, 60%)" />
            <text x="200" y="220" textAnchor="middle" fontSize="10" fill="#fff">🍷 BAR</text>
          </svg>
        );

      case "EXHIBITION":
        return (
          <svg viewBox="0 0 400 400" className="w-full h-auto">
            <rect width="400" height="400" fill="hsl(240, 10%, 5%)" rx="12" />
            {Array.from({ length: 9 }).map((_, i) => {
              const col = i % 3;
              const row = Math.floor(i / 3);
              return (
                <g key={`booth-${i}`} transform={`translate(${40 + col * 110}, ${40 + row * 110})`}>
                  <rect width="90" height="90" rx="6" fill="hsl(240, 6%, 14%)" stroke="hsl(43, 25%, 45%)" strokeWidth="1.5" />
                  <rect x="10" y="10" width="70" height="20" rx="3" fill="hsl(43, 25%, 35%)" />
                  <text x="45" y="24" textAnchor="middle" fontSize="9" fill="#fff" fontWeight="600">BOOTH {i + 1}</text>
                  <circle cx="45" cy="60" r="14" fill="hsl(43, 25%, 25%)" stroke="hsl(43, 35%, 50%)" />
                  <text x="45" y="64" textAnchor="middle" fontSize="14">{["🎨", "💡", "🎮", "🤖", "📱", "🔬", "🚀", "🎭", "🎪"][i]}</text>
                </g>
              );
            })}
          </svg>
        );

      default:
        return (
          <svg viewBox="0 0 400 400" className="w-full h-auto">
            <rect width="400" height="400" fill="hsl(240, 10%, 5%)" rx="12" />
            <rect x="40" y="40" width="320" height="320" rx="12" fill="hsl(240, 6%, 12%)" stroke="hsl(43, 25%, 40%)" strokeWidth="1.5" />
            <text x="200" y="195" textAnchor="middle" fontSize="48">📍</text>
            <text x="200" y="240" textAnchor="middle" fontSize="13" fill="hsl(240, 5%, 70%)" fontWeight="600">{zone.name}</text>
          </svg>
        );
    }
  };

  return (
    <div>
      {renderSvg()}
      {liveSessions.length > 0 && (
        <div className="border-t border-border p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Happening here</p>
          <ul className="space-y-3">
            {liveSessions.map(s => {
              const fillPct = Math.round((s.registered / s.capacity) * 100);
              const start = new Date(s.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
              const end = new Date(s.endsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
              const going = isRegistered(s.id);
              const ended = new Date(s.endsAt).getTime() < Date.now();
              const full = s.registered >= s.capacity;
              const disabled = !going && (ended || full);
              const label = going
                ? <span className="inline-flex items-center gap-1"><Check className="size-3" />Going</span>
                : ended ? "Ended" : full ? "Full" : "Register";
              return (
                <li key={s.id} className="rounded-lg border border-border bg-background/40 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{s.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{s.speaker}</p>
                      <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><Clock className="size-3" />{start}–{end}</span>
                        <span className="inline-flex items-center gap-1"><Users className="size-3" />{s.registered.toLocaleString()}/{s.capacity.toLocaleString()}</span>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(fillPct, 100)}%`,
                            background: fillPct > 80 ? "hsl(0, 72%, 56%)" : fillPct > 50 ? "hsl(33, 90%, 55%)" : "hsl(158, 65%, 45%)",
                          }}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => !disabled && handleToggle(s)}
                      disabled={disabled}
                      className={`shrink-0 rounded-md px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                        going
                          ? "bg-crowd-green/20 text-crowd-green hover:bg-crowd-green/30"
                          : disabled
                            ? "cursor-not-allowed bg-secondary text-muted-foreground"
                            : "bg-foreground text-background hover:opacity-90"
                      }`}
                    >
                      {label}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ZoneDetailView;
