// Road-following routing on a fixed grid of spines.
// Vertical spines: x ∈ {190, 400, 610}
// Horizontal spines: y ∈ {170, 360, 550}

export interface Point { x: number; y: number; }
export interface RouteResult {
  waypoints: Point[];
  distance: number;       // total SVG units
  etaMin: number;         // minutes (~80 units/min)
  steps: string[];        // turn-by-turn human directions
}

const VS = [190, 400, 610]; // vertical roads (x values)
const HS = [170, 360, 550]; // horizontal roads (y values)

// Friendly road names
const V_NAMES: Record<number, string> = {
  190: "West Avenue",
  400: "Central Avenue",
  610: "East Avenue",
};
const H_NAMES: Record<number, string> = {
  170: "North Cross",
  360: "Main Cross",
  550: "South Cross",
};

const nearest = (v: number, arr: number[]) =>
  arr.reduce((p, c) => (Math.abs(c - v) < Math.abs(p - v) ? c : p), arr[0]);

const dirH = (from: number, to: number) => (to >= from ? "east" : "west");
const dirV = (from: number, to: number) => (to >= from ? "south" : "north");

const turn = (prev: "H" | "V", nextDir: string, prevDir: string): "left" | "right" => {
  // simplified compass turn logic
  const map: Record<string, "left" | "right"> = {
    "east>south": "right", "east>north": "left",
    "west>south": "left",  "west>north": "right",
    "south>east": "left",  "south>west": "right",
    "north>east": "right", "north>west": "left",
  };
  return map[`${prevDir}>${nextDir}`] || "right";
};

const fmtDist = (units: number) => `${Math.max(10, Math.round(units * 0.5 / 5) * 5)}m`;

export function buildRoute(from: Point, to: Point): RouteResult {
  // Snap from/to to the nearest road intersection (entry & exit points)
  const fromVx = nearest(from.x, VS);
  const fromHy = nearest(from.y, HS);
  const toVx = nearest(to.x, VS);
  const toHy = nearest(to.y, HS);

  // Decide entry: snap to nearest spine (vertical or horizontal, whichever is closer)
  const fromUseV = Math.abs(from.x - fromVx) <= Math.abs(from.y - fromHy);
  const toUseV = Math.abs(to.x - toVx) <= Math.abs(to.y - toHy);

  const entry: Point = fromUseV ? { x: fromVx, y: from.y } : { x: from.x, y: fromHy };
  const exit: Point  = toUseV   ? { x: toVx,   y: to.y   } : { x: to.x,   y: toHy   };

  // Build along-road waypoints between entry and exit (Manhattan, prefer matching axis first)
  const wp: Point[] = [from, entry];

  // Pick a "via" intersection: corner between the two spines we travel
  if (fromUseV && toUseV) {
    // travel vertically on entry spine, then horizontal on a chosen cross to exit spine
    const crossY = nearest(exit.y, HS);
    if (entry.x !== exit.x) {
      wp.push({ x: entry.x, y: crossY });
      wp.push({ x: exit.x,  y: crossY });
    }
  } else if (!fromUseV && !toUseV) {
    const crossX = nearest(exit.x, VS);
    if (entry.y !== exit.y) {
      wp.push({ x: crossX, y: entry.y });
      wp.push({ x: crossX, y: exit.y  });
    }
  } else if (fromUseV && !toUseV) {
    // vertical first, then turn at exit.y
    wp.push({ x: entry.x, y: exit.y });
  } else {
    // horizontal first, then turn at exit.x
    wp.push({ x: exit.x, y: entry.y });
  }

  wp.push(exit, to);

  // Dedupe consecutive identical points
  const waypoints: Point[] = [];
  for (const p of wp) {
    const last = waypoints[waypoints.length - 1];
    if (!last || last.x !== p.x || last.y !== p.y) waypoints.push(p);
  }

  // Distance + steps
  let distance = 0;
  const steps: string[] = [];
  let prevDir: string | null = null;

  for (let i = 1; i < waypoints.length; i++) {
    const a = waypoints[i - 1];
    const b = waypoints[i];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const d = Math.hypot(dx, dy);
    distance += d;
    if (d < 4) continue;

    const isHorizontal = Math.abs(dx) > Math.abs(dy);
    const dir = isHorizontal ? dirH(a.x, b.x) : dirV(a.y, b.y);
    const onSpine = isHorizontal
      ? H_NAMES[nearest(a.y, HS)] || "the path"
      : V_NAMES[nearest(a.x, VS)] || "the path";

    if (i === 1) {
      steps.push(`Head ${dir} on ${onSpine} for ${fmtDist(d)}`);
    } else if (i === waypoints.length - 1) {
      steps.push(`Continue ${dir} for ${fmtDist(d)} — destination ahead`);
    } else if (prevDir && prevDir !== dir) {
      const t = turn("H", dir, prevDir);
      steps.push(`Turn ${t} onto ${onSpine} and continue ${fmtDist(d)}`);
    } else {
      steps.push(`Continue ${dir} on ${onSpine} for ${fmtDist(d)}`);
    }
    prevDir = dir;
  }

  const etaMin = Math.max(1, Math.round(distance / 80));
  return { waypoints, distance, etaMin, steps };
}
