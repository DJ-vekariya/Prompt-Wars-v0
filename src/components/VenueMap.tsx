import { useState } from "react";
import { zones as defaultZones, getCrowdLabel, type Zone } from "@/lib/mock-data";
import { buildRoute } from "@/lib/route";

interface VenueMapProps {
  mode?: "attendee" | "organizer";
  highlightZoneId?: string;
  onZoneClick?: (zoneId: string) => void;
  zonesData?: Zone[];
  showUserLocation?: boolean;
  userZoneId?: string;
  zoomedZoneId?: string | null;
  routeTargetId?: string | null;
}

const FULL_VIEW = { x: 0, y: 0, w: 800, h: 720 };

// Simple lucide-style mono SVG glyph paths (24x24 viewBox, drawn currentColor)
const GLYPHS: Record<string, JSX.Element> = {
  GATE: (
    <g>
      <path d="M3 21V8l9-5 9 5v13" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 21v-7a3 3 0 0 1 6 0v7" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </g>
  ),
  DOME: (
    <g>
      <path d="M4 20a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M2 20h20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12 4v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="3" r="1" fill="currentColor" />
    </g>
  ),
  PARKING: (
    <g>
      <rect x="4" y="4" width="16" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.6" fill="none" />
      <path d="M10 17V8h3.5a2.5 2.5 0 0 1 0 5H10" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ),
  FOOD: (
    <g>
      <path d="M5 3v8a3 3 0 0 0 6 0V3M8 3v18" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M16 3c-1.5 1-2 3-2 5s1 4 2 5v8" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </g>
  ),
  MEDICAL: (
    <g>
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.6" fill="none" />
      <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </g>
  ),
  SAFETY: (
    <g>
      <path d="M12 2 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6l-8-4z" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinejoin="round" />
    </g>
  ),
  EXHIBITION: (
    <g>
      <path d="M3 21V9l9-6 9 6v12" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinejoin="round" />
      <path d="M3 21h18M9 21v-6h6v6" stroke="currentColor" strokeWidth="1.6" fill="none" />
    </g>
  ),
  VIP: (
    <g>
      <path d="m12 2 2.6 6 6.4.6-4.8 4.4 1.4 6.4L12 16.5 6.4 19.4l1.4-6.4L3 8.6 9.4 8 12 2z" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinejoin="round" />
    </g>
  ),
  NETWORKING: (
    <g>
      <circle cx="6" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.6" fill="none" />
      <circle cx="18" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.6" fill="none" />
      <circle cx="12" cy="17" r="2.5" stroke="currentColor" strokeWidth="1.6" fill="none" />
      <path d="M8 9l3 6M16 9l-3 6" stroke="currentColor" strokeWidth="1.6" />
    </g>
  ),
  STAGE: (
    <g>
      <path d="M4 9h16v3a8 8 0 0 1-16 0V9z" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinejoin="round" />
      <path d="M12 17v4M8 21h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </g>
  ),
  SERVICE: (
    <g>
      <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="1.6" fill="none" />
      <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </g>
  ),
};

const VenueMap = ({
  highlightZoneId,
  onZoneClick,
  zonesData,
  showUserLocation = true,
  userZoneId = "zone-gate-2",
  zoomedZoneId,
  routeTargetId,
}: VenueMapProps) => {
  const zones = zonesData || defaultZones;
  const [tooltip, setTooltip] = useState<{ zone: Zone; x: number; y: number } | null>(null);
  const viewBox = FULL_VIEW;

  const isZoomed = false; // zoom removed — keep full view always

  const crowdStripe = (pct: number) => {
    if (pct < 0.5) return "hsl(158, 65%, 45%)";
    if (pct < 0.8) return "hsl(33, 90%, 55%)";
    return "hsl(0, 72%, 56%)";
  };

  // Zone footprint dimensions (rectangular cards) or circle for domes
  const zoneSize = (z: Zone): { w: number; h: number; isCircle: boolean; r?: number } => {
    if (z.type === "DOME") {
      const r = z.id === "zone-main-dome" ? 56 : 38;
      return { w: r * 2, h: r * 2, isCircle: true, r };
    }
    if (z.type === "STAGE") return { w: 160, h: 70, isCircle: false };
    if (z.type === "EXHIBITION") return { w: 110, h: 80, isCircle: false };
    if (z.type === "PARKING") return { w: 110, h: 70, isCircle: false };
    if (z.type === "GATE") return { w: 80, h: 50, isCircle: false };
    if (z.type === "FOOD") return { w: 100, h: 60, isCircle: false };
    if (z.type === "NETWORKING") return { w: 100, h: 60, isCircle: false };
    if (z.type === "VIP") return { w: 110, h: 60, isCircle: false };
    return { w: 100, h: 60, isCircle: false }; // medical, safety, service
  };

  const userZone = zones.find(z => z.id === userZoneId);
  const targetZone = routeTargetId ? zones.find(z => z.id === routeTargetId) : null;

  // Roads: clean blue corridors flowing between zone columns
  // Vertical spines along x=190, x=400, x=610; horizontal cross-streets at y=170, y=360, y=550.
  const roads = [
    // Verticals
    "M 190,40 L 190,680",
    "M 400,40 L 400,680",
    "M 610,40 L 610,680",
    // Horizontals
    "M 30,170 L 770,170",
    "M 30,360 L 770,360",
    "M 30,550 L 770,550",
  ];

  // Walking route along road network
  const route = userZone && targetZone
    ? buildRoute({ x: userZone.cx, y: userZone.cy }, { x: targetZone.cx, y: targetZone.cy })
    : null;
  const routePath = route
    ? route.waypoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`).join(" ")
    : null;
  const routeEta = route
    ? (() => {
        const mid = route.waypoints[Math.floor(route.waypoints.length / 2)];
        return { mins: route.etaMin, midX: mid.x, midY: mid.y - 14 };
      })()
    : null;

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-border bg-[hsl(40,30%,94%)]">
      <svg viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`} className="w-full h-auto">
        <defs>
          <filter id="card-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1" />
            <feOffset dx="0.5" dy="1" result="o" />
            <feComponentTransfer><feFuncA type="linear" slope="0.18" /></feComponentTransfer>
            <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Background */}
        <rect x="0" y="0" width="800" height="720" fill="hsl(40, 32%, 93%)" />
        {/* Subtle grid texture */}
        <g opacity="0.06">
          {Array.from({ length: 16 }).map((_, i) => (
            <line key={`gv-${i}`} x1={i * 50} y1="0" x2={i * 50} y2="720" stroke="hsl(220, 30%, 30%)" strokeWidth="0.5" />
          ))}
          {Array.from({ length: 15 }).map((_, i) => (
            <line key={`gh-${i}`} x1="0" y1={i * 50} x2="800" y2={i * 50} stroke="hsl(220, 30%, 30%)" strokeWidth="0.5" />
          ))}
        </g>

        {/* Boundary */}
        <rect x="14" y="14" width="772" height="692" rx="18" fill="none" stroke="hsl(220, 25%, 25%)" strokeWidth="1.2" opacity="0.45" />

        {/* === ROADS === thick blue corridors with white center hairline */}
        {roads.map((d, i) => (
          <path key={`r-${i}`} d={d} stroke="hsl(212, 78%, 52%)" strokeWidth="26" strokeLinecap="round" fill="none" opacity="0.92" />
        ))}
        {roads.map((d, i) => (
          <path key={`rc-${i}`} d={d} stroke="hsl(0, 0%, 100%)" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.85" strokeDasharray="2,6" />
        ))}

        {/* === WALKING ROUTE === */}
        {routePath && (
          <g className="pointer-events-none">
            {/* glow */}
            <path d={routePath} stroke="hsl(280, 80%, 60%)" strokeWidth="9" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.18" />
            <path id="route-path" d={routePath} stroke="hsl(280, 85%, 58%)" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="8,6">
              <animate attributeName="stroke-dashoffset" from="0" to="-28" dur="1s" repeatCount="indefinite" />
            </path>
            {/* Animated walking dot — previews journey */}
            <g>
              <circle r="9" fill="hsl(280, 85%, 58%)" opacity="0.25">
                <animateMotion dur={`${Math.max(3, route!.etaMin * 1.2)}s`} repeatCount="indefinite" rotate="auto">
                  <mpath href="#route-path" />
                </animateMotion>
              </circle>
              <circle r="5" fill="#fff" stroke="hsl(280, 85%, 58%)" strokeWidth="2.5">
                <animateMotion dur={`${Math.max(3, route!.etaMin * 1.2)}s`} repeatCount="indefinite" rotate="auto">
                  <mpath href="#route-path" />
                </animateMotion>
              </circle>
            </g>
            {routeEta && (
              <g transform={`translate(${routeEta.midX}, ${routeEta.midY - 14})`}>
                <rect x="-26" y="-10" width="52" height="20" rx="10" fill="hsl(280, 85%, 58%)" stroke="#fff" strokeWidth="1.2" />
                <text x="0" y="4" textAnchor="middle" fontSize="10" fill="#fff" fontWeight="700">{routeEta.mins} min</text>
              </g>
            )}
          </g>
        )}

        {/* === ZONES === */}
        {zones.map(zone => {
          const size = zoneSize(zone);
          const isHighlight = highlightZoneId === zone.id || zoomedZoneId === zone.id;
          const isDome = zone.type === "DOME";
          const isGate = zone.type === "GATE";
          const labelOutside = isGate || (zone.cx < 70 || zone.cx > 730 || zone.cy < 70 || zone.cy > 660);
          const showLabel = true;

          return (
            <g
              key={zone.id}
              onClick={() => onZoneClick?.(zone.id)}
              onMouseEnter={() => setTooltip({ zone, x: zone.cx, y: zone.cy - (size.isCircle ? size.r! : size.h / 2) - 10 })}
              onMouseLeave={() => setTooltip(null)}
              className="cursor-pointer"
            >
              {isDome ? (
                <g filter="url(#card-shadow)">
                  <circle
                    cx={zone.cx}
                    cy={zone.cy}
                    r={size.r}
                    fill="hsl(212, 78%, 52%)"
                    stroke={isHighlight ? "hsl(280, 85%, 58%)" : "hsl(212, 70%, 38%)"}
                    strokeWidth={isHighlight ? 3 : 1.5}
                  />
                  {/* Crowd stripe arc on top of dome */}
                  <path
                    d={`M ${zone.cx - size.r! + 4},${zone.cy} A ${size.r! - 4},${size.r! - 4} 0 0 1 ${zone.cx + size.r! - 4},${zone.cy}`}
                    stroke={crowdStripe(zone.crowdPct)}
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                    opacity="0.95"
                  />
                  {/* Icon */}
                  <g transform={`translate(${zone.cx - 12}, ${zone.cy - 16}) scale(1)`} className="pointer-events-none" color="#fff">
                    {GLYPHS.DOME}
                  </g>
                  {/* Inline label for big dome */}
                  {zone.id === "zone-main-dome" && (
                    <text x={zone.cx} y={zone.cy + 22} textAnchor="middle" fontSize="9" fontWeight="800" fill="#fff" letterSpacing="0.5" className="pointer-events-none select-none">
                      MAIN DOME
                    </text>
                  )}
                </g>
              ) : (
                <g filter="url(#card-shadow)">
                  {/* Card body */}
                  <rect
                    x={zone.cx - size.w / 2}
                    y={zone.cy - size.h / 2}
                    width={size.w}
                    height={size.h}
                    rx="8"
                    fill="#fff"
                    stroke={isHighlight ? "hsl(280, 85%, 58%)" : "hsl(220, 25%, 22%)"}
                    strokeWidth={isHighlight ? 2.5 : 1.2}
                  />
                  {/* Crowd density top stripe */}
                  <rect
                    x={zone.cx - size.w / 2 + 1}
                    y={zone.cy - size.h / 2 + 1}
                    width={size.w - 2}
                    height="4"
                    rx="2"
                    fill={crowdStripe(zone.crowdPct)}
                  />
                  {/* Mono icon */}
                  <g transform={`translate(${zone.cx - 12}, ${zone.cy - size.h / 2 + 10})`} className="pointer-events-none" color="hsl(220, 30%, 18%)">
                    {GLYPHS[zone.type] || GLYPHS.SERVICE}
                  </g>
                  {/* Inline label */}
                  {showLabel && !labelOutside && (
                    <text
                      x={zone.cx}
                      y={zone.cy + size.h / 2 - 8}
                      textAnchor="middle"
                      fontSize={size.w > 100 ? "9" : "7.5"}
                      fontWeight="700"
                      fill="hsl(220, 30%, 18%)"
                      letterSpacing="0.4"
                      className="pointer-events-none select-none"
                    >
                      {zone.name.toUpperCase()}
                    </text>
                  )}
                  {/* CLOSED ribbon */}
                  {!zone.isOpen && (
                    <g className="pointer-events-none" transform={`translate(${zone.cx + size.w / 2 - 4}, ${zone.cy - size.h / 2 + 4}) rotate(45)`}>
                      <rect x="-20" y="-5" width="40" height="10" fill="hsl(0, 72%, 50%)" />
                      <text x="0" y="2" textAnchor="middle" fontSize="6" fill="#fff" fontWeight="800" className="select-none">CLOSED</text>
                    </g>
                  )}
                </g>
              )}

              {/* Outside label (for gates / edge zones) */}
              {showLabel && labelOutside && (
                <g className="pointer-events-none">
                  <text
                    x={zone.cx}
                    y={zone.cy < 100 ? zone.cy - (size.isCircle ? size.r! : size.h / 2) - 6 : zone.cy + (size.isCircle ? size.r! : size.h / 2) + 14}
                    textAnchor="middle"
                    fontSize="8"
                    fontWeight="700"
                    fill="hsl(220, 30%, 18%)"
                    letterSpacing="0.4"
                    className="select-none"
                  >
                    {zone.name.toUpperCase()}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* "You Are Here" marker */}
        {showUserLocation && userZone && (
          <g transform={`translate(${userZone.cx}, ${userZone.cy})`} className="pointer-events-none">
            <circle r="18" fill="none" stroke="hsl(212, 90%, 50%)" strokeWidth="2" opacity="0.5">
              <animate attributeName="r" from="10" to="26" dur="1.6s" repeatCount="indefinite" />
              <animate attributeName="opacity" from="0.7" to="0" dur="1.6s" repeatCount="indefinite" />
            </circle>
            <circle r="9" fill="hsl(212, 90%, 50%)" opacity="0.25" />
            <circle r="5.5" fill="hsl(212, 90%, 50%)" stroke="#fff" strokeWidth="2" />
          </g>
        )}

        {/* Compass (small, top-right) */}
        <g transform="translate(750, 50)" className="pointer-events-none">
          <circle r="18" fill="#fff" stroke="hsl(220, 25%, 22%)" strokeWidth="1" />
          <polygon points="0,-12 -3,-3 3,-3" fill="hsl(0, 72%, 56%)" />
          <polygon points="0,12 -2.5,4 2.5,4" fill="hsl(220, 25%, 35%)" />
          <text textAnchor="middle" y="-13.5" fontSize="6.5" fontWeight="800" fill="hsl(220, 30%, 18%)">N</text>
        </g>

        {/* Hover tooltip */}
        {tooltip && !zoomedZoneId && (
          <g transform={`translate(${Math.min(Math.max(tooltip.x, 80), 720)}, ${Math.max(tooltip.y, 30)})`} className="pointer-events-none">
            <rect x="-66" y="-26" width="132" height="26" rx="6" fill="hsl(220, 30%, 14%)" />
            <text x="0" y="-15" textAnchor="middle" fontSize="9" fill="#fff" fontWeight="700">{tooltip.zone.name}</text>
            <text x="0" y="-5" textAnchor="middle" fontSize="7.5" fill={crowdStripe(tooltip.zone.crowdPct)} fontWeight="600">
              {getCrowdLabel(tooltip.zone.crowdPct)} • {Math.round(tooltip.zone.crowdPct * 100)}%
            </text>
          </g>
        )}

        {/* Floating legend */}
        {!isZoomed && (
          <g transform="translate(20, 650)" className="pointer-events-none">
            <rect width="220" height="56" rx="8" fill="#fff" opacity="0.95" stroke="hsl(220, 25%, 22%)" strokeWidth="0.6" />
            <text x="10" y="14" fontSize="7" fill="hsl(220, 30%, 30%)" fontWeight="800" letterSpacing="0.5">CROWD DENSITY</text>
            <g transform="translate(10, 24)">
              <rect width="14" height="4" rx="1" fill="hsl(158, 65%, 45%)" />
              <text x="20" y="4" fontSize="7" fill="hsl(220, 30%, 18%)" fontWeight="600">Clear</text>
              <rect x="64" width="14" height="4" rx="1" fill="hsl(33, 90%, 55%)" />
              <text x="84" y="4" fontSize="7" fill="hsl(220, 30%, 18%)" fontWeight="600">Moderate</text>
              <rect x="138" width="14" height="4" rx="1" fill="hsl(0, 72%, 56%)" />
              <text x="158" y="4" fontSize="7" fill="hsl(220, 30%, 18%)" fontWeight="600">Crowded</text>
            </g>
            <g transform="translate(10, 42)">
              <circle r="3.5" cx="3.5" cy="3.5" fill="hsl(212, 90%, 50%)" stroke="#fff" strokeWidth="1" />
              <text x="14" y="6" fontSize="7" fill="hsl(220, 30%, 18%)" fontWeight="600">You</text>
              <rect x="44" y="0" width="14" height="6" rx="2" fill="hsl(212, 78%, 52%)" />
              <text x="64" y="6" fontSize="7" fill="hsl(220, 30%, 18%)" fontWeight="600">Road</text>
              <path d="M118 3 L132 3" stroke="hsl(280, 85%, 58%)" strokeWidth="2" strokeDasharray="3,2" />
              <text x="138" y="6" fontSize="7" fill="hsl(220, 30%, 18%)" fontWeight="600">Route</text>
            </g>
          </g>
        )}
      </svg>
    </div>
  );
};

export default VenueMap;
