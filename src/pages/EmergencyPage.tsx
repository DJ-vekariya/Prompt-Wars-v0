import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, MapPin, AlertTriangle, Siren, Flame, ShieldAlert, Crosshair, Loader2 } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useUserZone } from "@/hooks/useUserZone";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const emergencyContacts = [
  { icon: Siren, label: "Medical Emergency", sublabel: "Hospital Zone", zone: "zone-hospital", color: "text-crowd-red" },
  { icon: Flame, label: "Fire / Ambulance", sublabel: "Ambulance Point", zone: "zone-ambulance", color: "text-crowd-amber" },
  { icon: ShieldAlert, label: "Security", sublabel: "Police Station", zone: "zone-police", color: "text-blue-400" },
];

const HELPLINE = "+18005550199";

const EmergencyPage = () => {
  const navigate = useNavigate();
  const [sending, setSending] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const { zone, setZone, allZones, detectNearestZone, isDetecting } = useUserZone();

  const handleAutoDetect = async () => {
    try {
      const next = await detectNearestZone();
      toast({ title: "Location detected", description: `Nearest zone: ${next.name}` });
    } catch (err) {
      toast({
        title: "Couldn't detect location",
        description: err instanceof Error ? err.message : "Permission denied or unavailable",
        variant: "destructive",
      });
    }
  };

  const handleSOS = async () => {
    if (sending) return;
    setSending(true);
    const { error } = await supabase.from("incidents").insert({
      type: "SOS",
      zone_id: zone.id,
      zone_name: zone.name,
      status: "OPEN",
      notes: "SOS triggered from Emergency screen",
    });
    setSending(false);
    if (error) {
      toast({ title: "Couldn't send SOS", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "SOS sent", description: `Marshals alerted at ${zone.name}.` });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="border-b border-destructive/30 bg-destructive/5 px-6 pb-6 pt-8">
        <button onClick={() => navigate("/home")} className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowLeft className="size-4" /> Back
        </button>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-destructive/20">
            <AlertTriangle className="size-5 text-destructive" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-medium text-foreground">Emergency</h1>
            <p className="text-sm text-muted-foreground">Get help immediately</p>
          </div>
        </div>
      </header>

      <div className="space-y-6 p-6">
        {/* Current zone indicator */}
        <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm">
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-primary" />
            <span className="text-muted-foreground">Sending from:</span>
            <span className="font-medium text-foreground">{zone.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleAutoDetect}
              disabled={isDetecting}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline disabled:opacity-60"
            >
              {isDetecting ? <Loader2 className="size-3 animate-spin" /> : <Crosshair className="size-3" />}
              {isDetecting ? "Detecting…" : "Auto"}
            </button>
            <button
              onClick={() => setPickerOpen(true)}
              className="text-xs font-medium text-primary hover:underline"
            >
              Change
            </button>
          </div>
        </div>

        {/* SOS Button */}
        <button
          onClick={handleSOS}
          disabled={sending}
          className="w-full rounded-2xl bg-destructive p-8 text-center shadow-lg shadow-destructive/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
        >
          <AlertTriangle className="mx-auto mb-3 size-10 text-destructive-foreground" />
          <p className="font-display text-xl font-semibold text-destructive-foreground">
            {sending ? "Sending…" : "Send SOS Alert"}
          </p>
          <p className="mt-1 text-sm text-destructive-foreground/70">Alerts nearby marshals with your location</p>
        </button>

        {/* Emergency Contacts */}
        <div>
          <h3 className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">Emergency Services</h3>
          <div className="space-y-2">
            {emergencyContacts.map(({ icon: Icon, label, sublabel, zone: zoneId, color }) => (
              <button
                key={zoneId}
                onClick={() => navigate(`/map?zone=${zoneId}`)}
                className="flex w-full items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-accent"
              >
                <div className={`flex size-10 items-center justify-center rounded-full bg-secondary ${color}`}>
                  <Icon className="size-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{sublabel}</p>
                </div>
                <MapPin className="size-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>

        {/* Call Help */}
        <a
          href={`tel:${HELPLINE}`}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card p-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          <Phone className="size-4 text-primary" />
          Call Event Helpline
        </a>
      </div>

      {/* Zone picker dialog */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Set your location</DialogTitle>
            <DialogDescription>
              Pick the zone closest to you. We'll send this with your SOS so marshals reach you faster.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-1">
            {allZones.map((z) => (
              <button
                key={z.id}
                onClick={() => {
                  setZone(z.id);
                  setPickerOpen(false);
                  toast({ title: "Location updated", description: z.name });
                }}
                className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                  z.id === zone.id
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-card text-foreground hover:bg-accent"
                }`}
              >
                <span className="font-medium">{z.name}</span>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">{z.type}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default EmergencyPage;
