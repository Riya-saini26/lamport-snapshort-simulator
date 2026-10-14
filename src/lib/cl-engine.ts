// Pure Chandy–Lamport simulation engine. No UI code here.
export type Msg = { id: number; kind: "app" | "marker"; amount: number };
export type Proc = { id: string; balance: number; events: number; recorded: number | null; sent: number; recv: number };
export type ChRec = { recording: boolean; msgs: number[]; done: boolean };
export type Tone = "app" | "marker" | "record" | "done" | "info";
export type LogEntry = { step: number; proc: string; type: string; text: string; tone: Tone };
export type Action =
  | { type: "send"; from: string; to: string; amount: number }
  | { type: "snapshot"; by: string }
  | { type: "deliver"; ch: string };

export type SimState = {
  procs: Proc[];
  links: string[];
  channels: Record<string, Msg[]>;
  rec: Record<string, ChRec>;
  inTransitAtSnapshot: Record<string, number[]>;
  log: LogEntry[];
  step: number;
  nextId: number;
  started: boolean;
  initiator: string | null;
  complete: boolean;
  line: number; // highlighted pseudocode line, -1 none
  lastCh: string | null;
  script: Action[];
  cursor: number;
  total: number;
};

export const chKey = (a: string, b: string) => `${a}->${b}`;
export const chEnds = (k: string) => k.split("->") as [string, string];
export const INITIAL_BALANCE = 100;

export function allLinks(ids: string[]) {
  const l: string[] = [];
  for (const a of ids) for (const b of ids) if (a !== b) l.push(chKey(a, b));
  return l;
}

export function makeScript(ids: string[], links: string[], initiator: string): Action[] {
  const has = (a: string, b: string) => links.includes(chKey(a, b));
  const cand: Action[] = [
    { type: "send", from: "P1", to: "P2", amount: 10 },
    { type: "send", from: "P3", to: "P1", amount: 5 },
    { type: "send", from: "P2", to: "P4", amount: 7 },
    { type: "snapshot", by: initiator },
    { type: "deliver", ch: chKey("P3", "P1") },
    { type: "send", from: "P4", to: "P3", amount: 3 },
  ];
  return cand.filter((a) => {
    if (a.type === "send") return ids.includes(a.from) && ids.includes(a.to) && has(a.from, a.to);
    if (a.type === "deliver") { const [f, t] = chEnds(a.ch); return has(f, t); }
    return true;
  });
}

export function reachableFrom(start: string, ids: string[], links: string[]) {
  const seen = new Set([start]);
  const q = [start];
  while (q.length) {
    const p = q.shift()!;
    for (const l of links) { const [a, b] = chEnds(l); if (a === p && !seen.has(b)) { seen.add(b); q.push(b); } }
  }
  return ids.filter((i) => !seen.has(i));
}

export function createState(ids: string[], links: string[], initiator: string): SimState {
  const channels: Record<string, Msg[]> = {};
  links.forEach((l) => (channels[l] = []));
  return {
    procs: ids.map((id) => ({ id, balance: INITIAL_BALANCE, events: 0, recorded: null, sent: 0, recv: 0 })),
    links, channels, rec: {}, inTransitAtSnapshot: {}, log: [], step: 0, nextId: 1,
    started: false, initiator: null, complete: false, line: -1, lastCh: null,
    script: makeScript(ids, links, initiator), cursor: 0, total: ids.length * INITIAL_BALANCE,
  };
}

const proc = (s: SimState, id: string) => {
  const p = s.procs.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown process ${id}`);
  return p;
};
const log = (s: SimState, proc: string, type: string, text: string, tone: Tone) =>
  s.log.push({ step: s.step, proc, type, text, tone });

function recordLocal(s: SimState, id: string) {
  const p = proc(s, id);
  p.recorded = p.balance;
  p.events++;
  log(s, id, "Record state", `${id} records its local state (balance = ${p.balance}).`, "record");
  for (const l of s.links) {
    const [, to] = chEnds(l);
    if (to === id) s.rec[l] = { recording: true, msgs: [], done: false };
  }
  for (const l of s.links) {
    const [from, to] = chEnds(l);
    if (from === id) {
      s.channels[l].push({ id: s.nextId++, kind: "marker", amount: 0 });
      log(s, id, "Send marker", `${id} sends a marker to ${to} before any further messages on ${l}.`, "marker");
    }
  }
}

function checkComplete(s: SimState) {
  if (s.complete) return;
  const allProcs = s.procs.every((p) => p.recorded !== null);
  const allCh = s.links.every((l) => s.rec[l]?.done);
  if (allProcs && allCh) {
    s.complete = true;
    s.line = 6;
    log(s, "—", "Snapshot complete", "Every process and every incoming channel has been recorded. Global snapshot completed.", "done");
  }
}

export function isFinished(s: SimState) {
  return s.cursor >= s.script.length && s.links.every((l) => (s.channels[l]?.length ?? 0) === 0);
}

/** Deterministic choice of the next event. */
export function nextAction(s: SimState): Action | null {
  if (s.cursor < s.script.length) return s.script[s.cursor];
  let best: string | null = null;
  let bestId = Infinity;
  for (const l of s.links) {
    const h = s.channels[l][0];
    if (h && h.id < bestId) { bestId = h.id; best = l; }
  }
  return best ? { type: "deliver", ch: best } : null;
}

export function apply(prev: SimState, a: Action, fromScript = false): SimState {
  const s: SimState = structuredClone(prev);
  s.step++;
  s.lastCh = null;
  if (fromScript) {
    s.cursor++;
    const stale = (a.type === "snapshot" && s.started) || (a.type === "deliver" && !s.channels[a.ch]?.length);
    if (stale) { log(s, "—", "Skip", "Scripted event no longer applies after manual changes; skipped.", "info"); return s; }
  }
  if (a.type === "send") {
    if (a.from === a.to) throw new Error("A process cannot send to itself.");
    const k = chKey(a.from, a.to);
    if (!s.links.includes(k)) throw new Error(`No channel ${k} exists.`);
    if (!(a.amount > 0)) throw new Error("Amount must be positive.");
    const p = proc(s, a.from);
    if (p.balance < a.amount) throw new Error(`${a.from} only has ${p.balance}.`);
    p.balance -= a.amount; p.sent++; p.events++;
    s.channels[k].push({ id: s.nextId++, kind: "app", amount: a.amount });
    s.line = -1; s.lastCh = k;
    log(s, a.from, "Send message", `${a.from} sends ${a.amount} to ${a.to}. Its balance drops to ${p.balance}.`, "app");
  } else if (a.type === "snapshot") {
    if (s.started) throw new Error("A snapshot is already in progress.");
    proc(s, a.by);
    s.started = true; s.initiator = a.by; s.line = 0;
    log(s, a.by, "Initiate", `${a.by} initiates the snapshot.`, "info");
    s.links.forEach((l) => { const q = s.channels[l].filter((m) => m.kind === "app"); if (q.length) s.inTransitAtSnapshot[l] = q.map((m) => m.amount); });
    recordLocal(s, a.by);
    s.line = 1;
  } else {
    const q = s.channels[a.ch];
    if (!q || q.length === 0) throw new Error(`Channel ${a.ch} is empty.`);
    const m = q.shift()!;
    const [from, to] = chEnds(a.ch);
    const p = proc(s, to);
    s.lastCh = a.ch;
    if (m.kind === "app") {
      p.balance += m.amount; p.recv++; p.events++;
      const r = s.rec[a.ch];
      if (r?.recording) {
        r.msgs.push(m.amount); s.line = 5;
        log(s, to, "Receive message", `${to} receives ${m.amount} from ${from}. It was in transit, so it is added to the state of ${a.ch}.`, "record");
      } else {
        s.line = -1;
        log(s, to, "Receive message", `${to} receives ${m.amount} from ${from}. Balance now ${p.balance}.`, "app");
      }
    } else {
      if (s.rec[a.ch]?.done) throw new Error("Duplicate marker on a finished channel.");
      if (p.recorded === null) {
        log(s, to, "First marker", `${to} receives its first marker (from ${from}).`, "marker");
        recordLocal(s, to);
        s.rec[a.ch] = { recording: false, msgs: [], done: true };
        log(s, to, "Record channel", `${to} records channel ${a.ch} as empty.`, "record");
        s.line = 3;
      } else {
        const r = s.rec[a.ch];
        r.recording = false; r.done = true;
        log(s, to, "Record channel", `${to} receives marker from ${from} and stops recording ${a.ch}: [${r.msgs.join(", ") || "empty"}].`, "record");
        s.line = 4;
      }
      const incoming = s.links.filter((l) => chEnds(l)[1] === to);
      if (incoming.every((l) => s.rec[l]?.done)) log(s, to, "Channels done", `${to} finishes recording all its incoming channels.`, "done");
    }
  }
  checkComplete(s);
  return s;
}

export function snapshotSum(s: SimState) {
  const local = s.procs.reduce((t, p) => t + (p.recorded ?? 0), 0);
  const ch = s.links.reduce((t, l) => t + (s.rec[l]?.msgs.reduce((a, b) => a + b, 0) ?? 0), 0);
  return { local, ch, sum: local + ch };
}

export const PSEUDOCODE = [
  "Initiator P: record local state",
  "P: send marker on every outgoing channel",
  "On receive marker on C at Q:",
  "  if first marker: record state, C = empty, send markers",
  "  else: stop recording C (C = msgs since record)",
  "On app msg on C while recording: append msg to C",
  "Done when all states and channels are recorded",
];
