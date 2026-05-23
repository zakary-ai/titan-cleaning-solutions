const bathroomVideo = "/demo/bathroom.mov";
const lockerRoomVideo = "/demo/locker-room.mov";
const lobbyVideo = "/demo/lobby.mov";

export const DEMO_PROPERTY = {
  name: "Demo Hotel",
  address: "123 Example Ave, Sample City",
};

export const DEMO_AREAS = [
  { id: "lobby", name: "Lobby" },
  { id: "locker", name: "Locker Room" },
  { id: "bathroom", name: "Bathroom" },
] as const;

export type DemoMedia = {
  type: "video" | "image";
  src: string;
  caption: string;
  uploadedAt: string; // ISO
};

// Today's report — uses the user-uploaded videos
export const DEMO_TODAY: Record<string, DemoMedia> = {
  lobby: {
    type: "video",
    src: lobbyVideo,
    caption: "This is an example video.",
    uploadedAt: new Date().toISOString(),
  },
  locker: {
    type: "video",
    src: lockerRoomVideo,
    caption: "This is an example video.",
    uploadedAt: new Date().toISOString(),
  },
  bathroom: {
    type: "video",
    src: bathroomVideo,
    caption: "This is an example video.",
    uploadedAt: new Date().toISOString(),
  },
};

// History — stock example photos for past dates
const stock = {
  lobby:
    "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1200&q=70",
  locker:
    "https://images.unsplash.com/photo-1583416750470-965b2707b355?auto=format&fit=crop&w=1200&q=70",
  bathroom:
    "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=1200&q=70",
};

function isoDaysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export const DEMO_HISTORY: Record<string, Record<string, DemoMedia>> = {
  [isoDaysAgo(1)]: {
    lobby: { type: "image", src: stock.lobby, caption: "This is an example picture.", uploadedAt: new Date(Date.now() - 86400000).toISOString() },
    locker: { type: "image", src: stock.locker, caption: "This is an example picture.", uploadedAt: new Date(Date.now() - 86400000).toISOString() },
    bathroom: { type: "image", src: stock.bathroom, caption: "This is an example picture.", uploadedAt: new Date(Date.now() - 86400000).toISOString() },
  },
  [isoDaysAgo(3)]: {
    lobby: { type: "image", src: stock.lobby, caption: "This is an example picture.", uploadedAt: new Date(Date.now() - 3 * 86400000).toISOString() },
    locker: { type: "image", src: stock.locker, caption: "This is an example picture.", uploadedAt: new Date(Date.now() - 3 * 86400000).toISOString() },
    bathroom: { type: "image", src: stock.bathroom, caption: "This is an example picture.", uploadedAt: new Date(Date.now() - 3 * 86400000).toISOString() },
  },
  [isoDaysAgo(7)]: {
    lobby: { type: "image", src: stock.lobby, caption: "This is an example picture.", uploadedAt: new Date(Date.now() - 7 * 86400000).toISOString() },
    locker: { type: "image", src: stock.locker, caption: "This is an example picture.", uploadedAt: new Date(Date.now() - 7 * 86400000).toISOString() },
    bathroom: { type: "image", src: stock.bathroom, caption: "This is an example picture.", uploadedAt: new Date(Date.now() - 7 * 86400000).toISOString() },
  },
};

export const DEMO_HISTORY_DATES = Object.keys(DEMO_HISTORY).sort();

// Special projects
export const DEMO_SPECIALS: Record<string, { id: string; caption: string; src: string; type: "image" | "video"; createdAt: string }[]> = {
  [isoDaysAgo(2)]: [
    {
      id: "sp1",
      caption: "Example special project — deep carpet clean in lobby.",
      src: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=70",
      type: "image",
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: "sp2",
      caption: "Example special project — chandelier polishing.",
      src: "https://images.unsplash.com/photo-1519642918688-7e43b19245d8?auto=format&fit=crop&w=1200&q=70",
      type: "image",
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
  ],
  [isoDaysAgo(5)]: [
    {
      id: "sp3",
      caption: "Example special project — exterior power washing.",
      src: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1200&q=70",
      type: "image",
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
  ],
};

export const DEMO_SPECIAL_DATES = Object.keys(DEMO_SPECIALS).sort();

// Comments (read-only example threads)
export type DemoMessage = { id: string; sender: "Client" | "Supervisor"; body: string; createdAt: string };
export type DemoThread = {
  id: string;
  title: string;
  area: string;
  status: "open" | "resolved";
  createdAt: string;
  messages: DemoMessage[];
};

export const DEMO_THREADS: DemoThread[] = [
  {
    id: "t1",
    title: "Lobby chandelier looking dusty",
    area: "Lobby",
    status: "open",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    messages: [
      { id: "m1", sender: "Client", body: "Hey team — the main chandelier looks a bit dusty in tonight's video. Can we add it to the special-project list for this week?", createdAt: new Date(Date.now() - 86400000).toISOString() },
      { id: "m2", sender: "Supervisor", body: "Absolutely. I'll schedule it for Thursday night and send before/after photos.", createdAt: new Date(Date.now() - 80000000).toISOString() },
    ],
  },
  {
    id: "t2",
    title: "Locker room mirrors have smudges",
    area: "Locker Room",
    status: "resolved",
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    messages: [
      { id: "m3", sender: "Client", body: "Mirrors near the entrance had visible smudges in last night's report.", createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
      { id: "m4", sender: "Supervisor", body: "Got it — retrained the team on the streak-free spray technique. Should be clean tonight.", createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
      { id: "m5", sender: "Client", body: "Confirmed, looks great. Thanks!", createdAt: new Date(Date.now() - 86400000).toISOString() },
    ],
  },
  {
    id: "t3",
    title: "Bathroom — appreciate the attention to detail",
    area: "Bathroom",
    status: "open",
    createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    messages: [
      { id: "m6", sender: "Client", body: "Just wanted to say the bathroom has been spotless all week. Keep it up!", createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString() },
    ],
  },
];
