import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Navigation, Car, Lock, Clock } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import BottomNav from "@/components/BottomNav";
import EmergencySOS from "@/components/EmergencySOS";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { zones } from "@/lib/mock-data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const EVENT_START = new Date("2026-07-15T09:00:00");
const ACTIVATION_TIME = new Date(EVENT_START.getTime() - 2 * 60 * 60 * 1000);

interface ParkingSelection {
  zoneId: string;
  zoneName: string;
  spot: string;
}

const PARKING_KEY = "parking-selection";

function readParking(): ParkingSelection | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PARKING_KEY);
    if (raw) return JSON.parse(raw) as ParkingSelection;
    // Legacy migration
    const legacy = localStorage.getItem("parking-spot");
    if (legacy) return { zoneId: "zone-parking-1", zoneName: "Parking 1", spot: legacy };
  } catch {
    /* ignore */
  }
  return null;
}

const TicketPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const displayName = user?.user_metadata?.display_name || "Guest User";
  const ticketId = user?.email?.startsWith("tkt") ? user.email.split("@")[0].toUpperCase().replace(/[^A-Z0-9]/g, "-") : "TKT-8492-AXBR";

  const [now, setNow] = useState(new Date());
  const [parkingOpen, setParkingOpen] = useState(false);
  const [parking, setParking] = useState<ParkingSelection | null>(() => readParking());
  const [draftZone, setDraftZone] = useState<string>(parking?.zoneId ?? "zone-parking-1");
  const [draftSpot, setDraftSpot] = useState<string>(parking?.spot ?? "");

  const parkingZones = zones.filter((z) => z.type === "PARKING");

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isActive = now >= ACTIVATION_TIME;
  const timeUntilActive = ACTIVATION_TIME.getTime() - now.getTime();
  const hoursLeft = Math.floor(timeUntilActive / (1000 * 60 * 60));
  const minutesLeft = Math.floor((timeUntilActive % (1000 * 60 * 60)) / (1000 * 60));
  const secondsLeft = Math.floor((timeUntilActive % (1000 * 60)) / 1000);

  const qrData = JSON.stringify({
    ticketId,
    userId: user?.id,
    event: "Global Summit 2026",
    activatedAt: isActive ? now.toISOString() : null,
  });

  const openParkingDialog = () => {
    setDraftZone(parking?.zoneId ?? "zone-parking-1");
    setDraftSpot(parking?.spot ?? "");
    setParkingOpen(true);
  };

  const saveParking = () => {
    const z = parkingZones.find((p) => p.id === draftZone);
    if (!z) return;
    const next: ParkingSelection = { zoneId: z.id, zoneName: z.name, spot: draftSpot.trim() };
    localStorage.setItem(PARKING_KEY, JSON.stringify(next));
    localStorage.removeItem("parking-spot");
    setParking(next);
    setParkingOpen(false);
    toast({ title: "Parking saved", description: `${z.name}${next.spot ? ` · ${next.spot}` : ""}` });
  };

  const clearParking = () => {
    localStorage.removeItem(PARKING_KEY);
    localStorage.removeItem("parking-spot");
    setParking(null);
    setParkingOpen(false);
    toast({ title: "Parking cleared" });
  };

  const parkingButtonLabel = parking
    ? parking.spot
      ? `${parking.zoneName} · ${parking.spot}`
      : parking.zoneName
    : "Save Parking";

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="border-b border-border px-6 pb-6 pt-8">
        <button onClick={() => navigate("/home")} className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowLeft className="size-4" /> Back
        </button>
        <h1 className="font-display text-2xl font-light tracking-tight text-foreground">My Ticket</h1>
      </header>

      <div className="space-y-6 p-6">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
          <div className="relative p-6">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Attendee</p>
                <p className="font-display text-lg font-medium text-foreground">{displayName}</p>
              </div>
              <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-medium text-primary">General</span>
            </div>

            <div className="mx-auto flex aspect-square w-48 items-center justify-center rounded-xl border border-border bg-white relative overflow-hidden">
              {isActive ? (
                <div className="text-center p-4">
                  <QRCodeSVG value={qrData} size={160} level="H" includeMargin={false} bgColor="#ffffff" fgColor="#000000" />
                </div>
              ) : (
                <div className="text-center p-4">
                  <div className="relative">
                    <QRCodeSVG value="LOCKED" size={120} level="L" bgColor="#ffffff" fgColor="#e5e5e5" />
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-lg">
                      <Lock className="size-8 text-muted-foreground/60" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-center gap-1">
                    <Clock className="size-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground font-mono tabular-nums">
                      {hoursLeft > 0 && `${hoursLeft}h `}{minutesLeft}m {secondsLeft}s
                    </p>
                  </div>
                </div>
              )}
            </div>

            <p className={`mt-3 text-center text-xs ${isActive ? "text-crowd-green font-medium" : "text-muted-foreground"}`}>
              {isActive ? "✓ QR Active — Scan at gate" : `Activates ${ACTIVATION_TIME.toLocaleDateString()} at ${ACTIVATION_TIME.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
            </p>

            <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Ticket ID</p>
                <p className="font-mono text-sm font-medium tabular-nums text-foreground">{ticketId}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Assigned Gate</p>
                <p className="text-sm font-medium text-foreground">Gate 2</p>
              </div>
            </div>
          </div>

          <div className="relative mx-4 border-t border-dashed border-border" />

          <div className="p-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div><p className="text-xs text-muted-foreground">Dome</p><p className="text-sm font-medium text-foreground">Main</p></div>
              <div><p className="text-xs text-muted-foreground">Section</p><p className="text-sm font-medium text-foreground">B</p></div>
              <div><p className="text-xs text-muted-foreground">Seat</p><p className="text-sm font-medium text-foreground">Row 12, #47</p></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => navigate("/map?zone=zone-main-dome")} className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card p-4 text-sm font-medium text-foreground transition-colors hover:bg-accent">
            <Navigation className="size-4 text-primary" /> Find My Seat
          </button>
          <button
            onClick={openParkingDialog}
            className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card p-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <Car className="size-4 text-primary" />
            <span className="truncate">{parkingButtonLabel}</span>
          </button>
        </div>
      </div>

      <Dialog open={parkingOpen} onOpenChange={setParkingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save your parking spot</DialogTitle>
            <DialogDescription>Pick a parking zone and add your row/spot so you can find your car later.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Parking zone</p>
              <div className="grid grid-cols-2 gap-2">
                {parkingZones.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setDraftZone(p.id)}
                    className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                      draftZone === p.id
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-card text-foreground hover:bg-accent"
                    }`}
                  >
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">Cap. {p.capacity.toLocaleString()}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Row / spot (optional)</p>
              <Input
                placeholder="e.g. Row B12"
                value={draftSpot}
                onChange={(e) => setDraftSpot(e.target.value)}
              />
            </div>

            {parking && (
              <button
                type="button"
                onClick={() => {
                  setParkingOpen(false);
                  navigate(`/map?zone=${parking.zoneId}`);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card py-2 text-sm font-medium text-foreground hover:bg-accent"
              >
                <Navigation className="size-4 text-primary" /> Navigate to my parking
              </button>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            {parking && (
              <button
                type="button"
                onClick={clearParking}
                className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={saveParking}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Save
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />
      <EmergencySOS />
    </div>
  );
};

export default TicketPage;
