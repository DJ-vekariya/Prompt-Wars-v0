import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Users, AlertTriangle, DoorOpen, Activity, CheckCircle, UserPlus, LogOut, Shield, Loader2 } from "lucide-react";
import VenueMap from "@/components/VenueMap";
import CrowdBadge from "@/components/CrowdBadge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useZones } from "@/hooks/useZones";
import { useIncidents } from "@/hooks/useIncidents";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Zone, Incident } from "@/lib/mock-data";

const incidentIcons: Record<string, { icon: typeof AlertTriangle; color: string }> = {
  SOS: { icon: AlertTriangle, color: "text-crowd-red" },
  MEDICAL: { icon: Activity, color: "text-crowd-amber" },
  FIRE: { icon: AlertTriangle, color: "text-crowd-red" },
  CROWD: { icon: Users, color: "text-crowd-amber" },
  SECURITY: { icon: AlertTriangle, color: "text-blue-400" },
  OTHER: { icon: AlertTriangle, color: "text-muted-foreground" },
};

const simulateCrowd = (zones: Zone[]): Zone[] =>
  zones.map(z => ({
    ...z,
    crowdPct: Math.max(0.02, Math.min(0.99, z.crowdPct + (Math.random() - 0.48) * 0.08)),
  }));

interface OrganizerRow {
  user_id: string;
  email: string;
  display_name: string | null;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { zones: dbZones } = useZones();
  const { incidents: dbIncidents } = useIncidents();
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [liveZones, setLiveZones] = useState<Zone[]>(dbZones);
  const [incidentList, setIncidentList] = useState<Incident[]>(dbIncidents);

  const [organizers, setOrganizers] = useState<OrganizerRow[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [promoteEmail, setPromoteEmail] = useState("");
  const [promoting, setPromoting] = useState(false);

  useEffect(() => { setLiveZones(dbZones); }, [dbZones]);
  useEffect(() => { setIncidentList(dbIncidents); }, [dbIncidents]);

  useEffect(() => {
    const interval = setInterval(() => setLiveZones(prev => simulateCrowd(prev)), 4000);
    return () => clearInterval(interval);
  }, []);

  const loadOrganizers = useCallback(async () => {
    setLoadingOrgs(true);
    const { data, error } = await supabase.rpc("list_organizers");
    setLoadingOrgs(false);
    if (error) {
      toast({ title: "Couldn't load organizers", description: error.message, variant: "destructive" });
      return;
    }
    setOrganizers((data as OrganizerRow[]) ?? []);
  }, []);

  useEffect(() => { loadOrganizers(); }, [loadOrganizers]);

  const handlePromote = async () => {
    const email = promoteEmail.trim();
    if (!email) return;
    setPromoting(true);
    const { data, error } = await supabase.rpc("promote_user_to_organizer", { _email: email });
    setPromoting(false);
    if (error) {
      toast({ title: "Promotion failed", description: error.message, variant: "destructive" });
      return;
    }
    const result = data as { success: boolean; error?: string };
    if (!result?.success) {
      toast({ title: "Promotion failed", description: result?.error ?? "Unknown error", variant: "destructive" });
      return;
    }
    toast({ title: "User promoted", description: `${email} is now an organizer.` });
    setPromoteEmail("");
    loadOrganizers();
  };

  const openGates = liveZones.filter(z => z.type === "GATE" && z.isOpen).length;
  const openIncidents = incidentList.filter(i => i.status === "OPEN").length;
  const avgCrowd = Math.round(liveZones.reduce((s, z) => s + z.crowdPct, 0) / liveZones.length * 100);

  const handleResolve = async (id: string) => {
    setIncidentList(prev => prev.map(i => i.id === id ? { ...i, status: "RESOLVED" as const } : i));
    await supabase.from("incidents").update({ status: "RESOLVED" }).eq("id", id);
  };

  const handleAssign = async (id: string) => {
    setIncidentList(prev => prev.map(i => i.id === id ? { ...i, status: "ASSIGNED" as const, assignedTo: "Marshal Team A" } : i));
    await supabase.from("incidents").update({ status: "ASSIGNED", assigned_to: "Marshal Team A" }).eq("id", id);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b border-border px-6 pb-4 pt-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Organizer Portal</p>
          <h1 className="mt-1 font-display text-2xl font-light tracking-tight text-foreground">Command Center</h1>
        </div>
        <button onClick={async () => { await signOut(); navigate("/"); }} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-accent">
          <LogOut className="size-3.5" /> Sign Out
        </button>
      </header>

      <Tabs defaultValue="overview" className="px-6 pt-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="admins">
            <Shield className="mr-1.5 size-3.5" /> Admins
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { icon: Users, label: "Total Scanned", value: "12,847", color: "text-primary" },
              { icon: AlertTriangle, label: "Active Incidents", value: String(openIncidents), color: "text-crowd-red" },
              { icon: DoorOpen, label: "Gates Open", value: `${openGates} / ${liveZones.filter(z => z.type === 'GATE').length}`, color: "text-crowd-green" },
              { icon: Activity, label: "Avg Crowd", value: `${avgCrowd}%`, color: "text-crowd-amber" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="rounded-xl border border-border bg-card p-4">
                <Icon className={`mb-2 size-4 ${color}`} />
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="font-display text-2xl font-medium tabular-nums text-foreground">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-6 pb-8 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <h3 className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">Live Heatmap</h3>
              <VenueMap mode="organizer" zonesData={liveZones} highlightZoneId={selectedZone || undefined} onZoneClick={(id) => setSelectedZone(id === selectedZone ? null : id)} />
              <div className="mt-4 space-y-1">
                {liveZones.filter(z => z.type === "GATE").map(zone => (
                  <div key={zone.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className={`size-2 rounded-full ${zone.isOpen ? "bg-crowd-green" : "bg-crowd-red"}`} />
                      <span className="text-sm text-foreground">{zone.name}</span>
                    </div>
                    <CrowdBadge pct={zone.crowdPct} size="sm" />
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2">
              <h3 className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">Incident Feed</h3>
              <div className="space-y-3">
                {incidentList.map((incident) => {
                  const { icon: Icon, color } = incidentIcons[incident.type] || incidentIcons.OTHER;
                  return (
                    <div key={incident.id} className="rounded-xl border border-border bg-card p-4">
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className={`size-4 ${color}`} />
                          <span className="text-sm font-medium text-foreground">{incident.type}</span>
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${incident.status === "OPEN" ? "bg-crowd-red/20 text-crowd-red" : incident.status === "ASSIGNED" ? "bg-crowd-amber/20 text-crowd-amber" : "bg-crowd-green/20 text-crowd-green"}`}>{incident.status}</span>
                      </div>
                      <p className="text-sm text-foreground/80">{incident.notes}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{incident.zoneName}</span>
                        {incident.assignedTo && <span className="text-xs text-muted-foreground">→ {incident.assignedTo}</span>}
                      </div>
                      {incident.status !== "RESOLVED" && (
                        <div className="mt-3 flex gap-2">
                          {incident.status === "OPEN" && (
                            <button onClick={() => handleAssign(incident.id)} className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent">
                              <UserPlus className="size-3" /> Assign
                            </button>
                          )}
                          <button onClick={() => handleResolve(incident.id)} className="flex items-center gap-1 rounded-lg bg-crowd-green/20 px-3 py-1.5 text-xs font-medium text-crowd-green transition-colors hover:bg-crowd-green/30">
                            <CheckCircle className="size-3" /> Resolve
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="admins" className="mt-4 pb-8">
          <div className="mx-auto max-w-2xl space-y-6">
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-1 font-display text-lg font-medium text-foreground">Promote a user</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Grant organizer access by email. The user must already have an account.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  type="email"
                  placeholder="user@example.com"
                  value={promoteEmail}
                  onChange={(e) => setPromoteEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !promoting) handlePromote(); }}
                  disabled={promoting}
                />
                <button
                  onClick={handlePromote}
                  disabled={promoting || !promoteEmail.trim()}
                  className="flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                >
                  {promoting ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
                  Promote
                </button>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Current organizers ({organizers.length})
              </h3>
              {loadingOrgs ? (
                <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> Loading…
                </div>
              ) : organizers.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
                  No organizers yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {organizers.map((org) => (
                    <div key={org.user_id} className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{org.display_name || org.email}</p>
                        <p className="text-xs text-muted-foreground">{org.email}</p>
                      </div>
                      <span className="flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                        <Shield className="size-3" /> Organizer
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
