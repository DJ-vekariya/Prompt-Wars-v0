import { useNavigate } from "react-router-dom";
import { LogOut, User, Ticket, Shield, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import BottomNav from "@/components/BottomNav";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, role, signOut } = useAuth();
  const displayName = user?.user_metadata?.display_name || user?.email || "Attendee";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="border-b border-border px-6 pb-6 pt-8">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Account</p>
        <h1 className="mt-1 font-display text-2xl font-light tracking-tight text-foreground">Profile</h1>
      </header>

      <div className="space-y-6 p-6">
        {/* Avatar & Name */}
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
            <User className="size-7 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-display text-lg font-medium text-foreground">{displayName}</p>
            <p className="text-xs text-muted-foreground capitalize">{role || "attendee"}</p>
          </div>
        </div>

        {/* Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
            <div className="flex items-center gap-3">
              <Ticket className="size-4 text-muted-foreground" />
              <span className="text-sm text-foreground">My Ticket</span>
            </div>
            <button onClick={() => navigate("/ticket")} className="text-xs text-primary flex items-center gap-1">
              View <ChevronRight className="size-3" />
            </button>
          </div>

          {role === "organizer" && (
            <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
              <div className="flex items-center gap-3">
                <Shield className="size-4 text-muted-foreground" />
                <span className="text-sm text-foreground">Admin Dashboard</span>
              </div>
              <button onClick={() => navigate("/admin")} className="text-xs text-primary flex items-center gap-1">
                Open <ChevronRight className="size-3" />
              </button>
            </div>
          )}
        </div>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
        >
          <LogOut className="size-4" />
          Sign Out
        </button>
      </div>

      <BottomNav />
    </div>
  );
};

export default ProfilePage;
