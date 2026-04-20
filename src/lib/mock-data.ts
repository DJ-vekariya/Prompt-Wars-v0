export interface Zone {
  id: string;
  name: string;
  type: 'GATE' | 'DOME' | 'PARKING' | 'SERVICE' | 'FOOD' | 'MEDICAL' | 'SAFETY' | 'VIP' | 'EXHIBITION' | 'NETWORKING' | 'STAGE';
  capacity: number;
  crowdPct: number;
  isOpen: boolean;
  cx: number;
  cy: number;
}

export interface Session {
  id: string;
  title: string;
  speaker: string;
  dome: string;
  domeId: string;
  startsAt: string;
  endsAt: string;
  track: 'KEYNOTE' | 'WORKSHOP' | 'PANEL' | 'DEMO';
  capacity: number;
  registered: number;
  description: string;
}

export interface Incident {
  id: string;
  type: 'SOS' | 'MEDICAL' | 'FIRE' | 'CROWD' | 'SECURITY' | 'OTHER';
  zoneName: string;
  zoneId: string;
  status: 'OPEN' | 'ASSIGNED' | 'RESOLVED';
  assignedTo?: string;
  notes?: string;
  createdAt: string;
}

// Floor-plan layout on 800×720 viewBox.
// Roads are fixed grid lines: x ∈ {190, 400, 610}, y ∈ {170, 360, 550}.
// All zones positioned in 4 lane columns (95 / 295 / 505 / 705) and rows
// between road spines (90, 265, 455, 625) so cards never cross roads.
export const zones: Zone[] = [
  // Gates — perimeter (small cards on edges, just outside main grid)
  { id: 'zone-gate-2',     name: 'Gate 2',               type: 'GATE',       capacity: 5000,  crowdPct: 0.35, isOpen: true,  cx: 50,  cy: 90  },
  { id: 'zone-gate-4',     name: 'Gate 4',               type: 'GATE',       capacity: 5000,  crowdPct: 0.72, isOpen: true,  cx: 750, cy: 90  },
  { id: 'zone-kalupur-n',  name: 'Kalupur Gate (N)',     type: 'GATE',       capacity: 3000,  crowdPct: 0.88, isOpen: true,  cx: 50,  cy: 625 },
  { id: 'zone-kalupur-s',  name: 'Kalupur Gate (S)',     type: 'GATE',       capacity: 3000,  crowdPct: 0.15, isOpen: false, cx: 750, cy: 625 },

  // Domes — center column (around Main)
  { id: 'zone-main-dome',  name: 'Main Dome',            type: 'DOME',       capacity: 15000, crowdPct: 0.65, isOpen: true,  cx: 400, cy: 360 },
  { id: 'zone-dome1-n',    name: 'Dome 1 North',         type: 'DOME',       capacity: 3000,  crowdPct: 0.45, isOpen: true,  cx: 295, cy: 265 },
  { id: 'zone-dome1-s',    name: 'Dome 1 South',         type: 'DOME',       capacity: 3000,  crowdPct: 0.92, isOpen: true,  cx: 295, cy: 455 },
  { id: 'zone-dome3',      name: 'Dome 3',               type: 'DOME',       capacity: 2000,  crowdPct: 0.30, isOpen: true,  cx: 505, cy: 265 },
  { id: 'zone-army-dome',  name: 'Army Dome',            type: 'DOME',       capacity: 2000,  crowdPct: 0.20, isOpen: true,  cx: 505, cy: 455 },

  // Left lane (x=95) — parking / safety / cultural
  { id: 'zone-parking-1',   name: 'Parking 1',           type: 'PARKING',    capacity: 3000,  crowdPct: 0.60, isOpen: true,  cx: 95,  cy: 90  },
  { id: 'zone-ambulance',   name: 'Ambulance & Fire',    type: 'SAFETY',     capacity: 30,    crowdPct: 0.05, isOpen: true,  cx: 95,  cy: 265 },
  { id: 'zone-sponsor-hall',name: 'Cultural Exhibition', type: 'EXHIBITION', capacity: 3000,  crowdPct: 0.50, isOpen: true,  cx: 95,  cy: 455 },
  { id: 'zone-parking-vip', name: 'VIP Parking',         type: 'PARKING',    capacity: 500,   crowdPct: 0.25, isOpen: true,  cx: 95,  cy: 625 },

  // Right lane (x=705) — parking / safety / food / exhibition
  { id: 'zone-parking-3',    name: 'Parking 3',          type: 'PARKING',    capacity: 2000,  crowdPct: 0.40, isOpen: true,  cx: 705, cy: 90  },
  { id: 'zone-police',       name: 'Police Station',     type: 'SAFETY',     capacity: 30,    crowdPct: 0.08, isOpen: true,  cx: 705, cy: 265 },
  { id: 'zone-exhibition',   name: 'Glow Garden',        type: 'EXHIBITION', capacity: 5000,  crowdPct: 0.70, isOpen: true,  cx: 705, cy: 455 },
  { id: 'zone-parking-4',    name: 'Parking 4',          type: 'PARKING',    capacity: 2000,  crowdPct: 0.55, isOpen: true,  cx: 705, cy: 625 },

  // Inner lanes — extras between domes and edges
  { id: 'zone-press-room',   name: 'Conference Room',    type: 'SERVICE',    capacity: 200,   crowdPct: 0.30, isOpen: true,  cx: 400, cy: 90  },
  { id: 'zone-main-stage',   name: 'Main Stage',         type: 'STAGE',      capacity: 20000, crowdPct: 0.75, isOpen: true,  cx: 400, cy: 625 },
  { id: 'zone-hospital',     name: 'Hospital',           type: 'MEDICAL',    capacity: 50,    crowdPct: 0.10, isOpen: true,  cx: 295, cy: 90  },
  { id: 'zone-vip-lounge',   name: 'VIP Lounge',         type: 'VIP',        capacity: 300,   crowdPct: 0.40, isOpen: true,  cx: 505, cy: 90  },
  { id: 'zone-food-sant',    name: 'Sant Bhojanalay',    type: 'FOOD',       capacity: 800,   crowdPct: 0.35, isOpen: true,  cx: 295, cy: 625 },
  { id: 'zone-food-vip',     name: 'VIP Bhojanalay',     type: 'FOOD',       capacity: 500,   crowdPct: 0.25, isOpen: true,  cx: 505, cy: 625 },
  { id: 'zone-food-general', name: 'General Bhojanalay', type: 'FOOD',       capacity: 2000,  crowdPct: 0.58, isOpen: true,  cx: 200, cy: 360 },

  // Networking corners
  { id: 'zone-networking-n', name: 'Night Show (N)',     type: 'NETWORKING', capacity: 2000,  crowdPct: 0.45, isOpen: true,  cx: 600, cy: 360 },
  { id: 'zone-networking-s', name: 'Night Show (S)',     type: 'NETWORKING', capacity: 2000,  crowdPct: 0.38, isOpen: true,  cx: 200, cy: 90  },
];

export const sessions: Session[] = [
  {
    id: 's1', title: 'Opening Keynote: Future of Connected Experiences',
    speaker: 'Dr. Arjun Mehta', dome: 'Main Dome', domeId: 'zone-main-dome',
    startsAt: '2026-04-14T09:00:00', endsAt: '2026-04-14T10:30:00',
    track: 'KEYNOTE', capacity: 15000, registered: 12400,
    description: 'An inspiring keynote on the future of large-scale immersive events and how technology bridges physical and digital experiences.',
  },
  {
    id: 's2', title: 'Building Scalable Real-Time Systems',
    speaker: 'Priya Sharma', dome: 'Dome 1 North', domeId: 'zone-dome1-n',
    startsAt: '2026-04-14T11:00:00', endsAt: '2026-04-14T12:00:00',
    track: 'WORKSHOP', capacity: 3000, registered: 2100,
    description: 'Hands-on workshop covering WebSocket architectures, event sourcing, and crowd-aware routing algorithms.',
  },
  {
    id: 's3', title: 'AI-Powered Crowd Management',
    speaker: 'Rahul Verma', dome: 'Dome 1 South', domeId: 'zone-dome1-s',
    startsAt: '2026-04-14T11:00:00', endsAt: '2026-04-14T12:30:00',
    track: 'PANEL', capacity: 3000, registered: 2800,
    description: 'Panel discussion on using machine learning for real-time crowd density prediction and automated zone management.',
  },
  {
    id: 's4', title: 'Venue IoT Demo: Sensors at Scale',
    speaker: 'Ananya Patel', dome: 'Glow Garden', domeId: 'zone-exhibition',
    startsAt: '2026-04-14T13:00:00', endsAt: '2026-04-14T14:00:00',
    track: 'DEMO', capacity: 5000, registered: 1500,
    description: 'Live demonstration of IoT sensor networks for crowd counting, air quality monitoring, and automated lighting.',
  },
  {
    id: 's5', title: 'Designing for 50,000: UX at Scale',
    speaker: 'Kavitha Nair', dome: 'Dome 3', domeId: 'zone-dome3',
    startsAt: '2026-04-14T14:30:00', endsAt: '2026-04-14T15:30:00',
    track: 'WORKSHOP', capacity: 2000, registered: 1800,
    description: 'How to design wayfinding, signage systems, and digital experiences that work for tens of thousands simultaneously.',
  },
  {
    id: 's6', title: 'Closing Ceremony & Cultural Performance',
    speaker: 'Various Artists', dome: 'Main Dome', domeId: 'zone-main-dome',
    startsAt: '2026-04-14T18:00:00', endsAt: '2026-04-14T20:00:00',
    track: 'KEYNOTE', capacity: 15000, registered: 14200,
    description: 'Grand closing ceremony featuring traditional performances, award presentations, and a preview of next year\'s event.',
  },
];

export const incidents: Incident[] = [
  { id: 'i1', type: 'MEDICAL', zoneName: 'Gate 4', zoneId: 'zone-gate-4', status: 'OPEN', createdAt: '2026-04-14T09:15:00', notes: 'Attendee feeling dizzy near security checkpoint' },
  { id: 'i2', type: 'CROWD', zoneName: 'Dome 1 South', zoneId: 'zone-dome1-s', status: 'ASSIGNED', assignedTo: 'Marshal Team B', createdAt: '2026-04-14T09:05:00', notes: 'Capacity exceeding safe limit' },
  { id: 'i3', type: 'SOS', zoneName: 'General Bhojanalay', zoneId: 'zone-food-general', status: 'OPEN', createdAt: '2026-04-14T09:20:00', notes: 'Child separated from parent' },
  { id: 'i4', type: 'SECURITY', zoneName: 'Glow Garden', zoneId: 'zone-exhibition', status: 'RESOLVED', assignedTo: 'Security Unit 3', createdAt: '2026-04-14T08:30:00', notes: 'Unauthorized access attempt' },
];

export function getCrowdColor(pct: number): 'green' | 'amber' | 'red' {
  if (pct < 0.5) return 'green';
  if (pct < 0.8) return 'amber';
  return 'red';
}

export function getCrowdLabel(pct: number): string {
  if (pct < 0.5) return 'Clear';
  if (pct < 0.8) return 'Moderate';
  return 'Crowded';
}
