import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

const EmergencySOS = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/emergency")}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-destructive px-5 py-3 font-display text-sm font-semibold text-destructive-foreground shadow-lg shadow-destructive/30 transition-all hover:scale-105 hover:shadow-xl hover:shadow-destructive/40 active:scale-95"
    >
      <AlertTriangle className="size-4" />
      SOS
    </button>
  );
};

export default EmergencySOS;
