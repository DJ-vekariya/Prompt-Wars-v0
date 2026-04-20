import { getCrowdColor } from "@/lib/mock-data";

interface CrowdBadgeProps {
  pct: number;
  showLabel?: boolean;
  size?: "sm" | "md";
}

const CrowdBadge = ({ pct, showLabel = true, size = "md" }: CrowdBadgeProps) => {
  const color = getCrowdColor(pct);
  const label = pct < 0.5 ? "Clear" : pct < 0.8 ? "Moderate" : "Crowded";
  const percentage = Math.round(pct * 100);

  const dotSize = size === "sm" ? "size-1.5" : "size-2";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <div className="flex items-center gap-2">
      <div className={`${dotSize} rounded-full ${
        color === "green" ? "bg-crowd-green" : 
        color === "amber" ? "bg-crowd-amber animate-pulse-glow" : 
        "bg-crowd-red animate-pulse"
      }`} />
      {showLabel && (
        <span className={`${textSize} tabular-nums font-medium ${
          color === "green" ? "text-crowd-green" : 
          color === "amber" ? "text-crowd-amber" : 
          "text-crowd-red"
        }`}>
          {label} · {percentage}%
        </span>
      )}
    </div>
  );
};

export default CrowdBadge;
