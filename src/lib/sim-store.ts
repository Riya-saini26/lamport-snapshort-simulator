import { create } from "zustand";
import { allLinks, apply, createState, nextAction, reachableFrom, type Action, type SimState } from "./cl-engine";

const idsFor = (n: number) => Array.from({ length: n }, (_, i) => `P${i + 1}`);

type Store = {
  n: number;
  links: string[];
  initiator: string;
  speed: number; // ms per step
  playing: boolean;
  state: SimState;
  history: SimState[];
  error: string | null;
  configError: () => string | null;
  step: () => boolean;
  back: () => void;
  reset: () => void;
  act: (a: Action) => void;
  setN: (n: number) => void;
  toggleLink: (k: string) => void;
  setInitiator: (p: string) => void;
  setSpeed: (ms: number) => void;
  setPlaying: (p: boolean) => void;
  loadExample: () => void;
  clearLog: () => void;
  dismiss: () => void;
};

export const useSim = create<Store>((set, get) => ({
  n: 4,
  links: allLinks(idsFor(4)),
  initiator: "P1",
  speed: 900,
  playing: false,
  state: createState(idsFor(4), allLinks(idsFor(4)), "P1"),
  history: [],
  error: null,
  configError: () => {
    const { n, links, initiator } = get();
    const missing = reachableFrom(initiator, idsFor(n), links);
    if (missing.length) return `${missing.join(", ")} cannot be reached from ${initiator}; markers would never arrive.`;
    return null;
  },
  step: () => {
    const { state, configError } = get();
    const ce = configError();
    if (ce) { set({ error: ce, playing: false }); return false; }
    const a = nextAction(state);
    if (!a) { set({ playing: false }); return false; }
    try {
      const next = apply(state, a, state.cursor < state.script.length);
      set({ state: next, history: [...get().history, state], error: null });
      return true;
    } catch (e) {
      set({ error: (e as Error).message, playing: false });
      return false;
    }
  },
  back: () => {
    const h = get().history;
    if (!h.length) return;
    set({ state: h[h.length - 1], history: h.slice(0, -1), playing: false, error: null });
  },
  reset: () => {
    const { n, links, initiator } = get();
    set({ state: createState(idsFor(n), links, initiator), history: [], playing: false, error: null });
  },
  act: (a) => {
    const { state } = get();
    try {
      set({ state: apply(state, a), history: [...get().history, state], error: null });
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },
  setN: (n) => {
    n = Math.max(2, Math.min(6, n));
    const ids = idsFor(n);
    const initiator = ids.includes(get().initiator) ? get().initiator : "P1";
    set({ n, links: allLinks(ids), initiator });
    get().reset();
  },
  toggleLink: (k) => {
    const links = get().links.includes(k) ? get().links.filter((l) => l !== k) : [...get().links, k];
    set({ links });
    get().reset();
  },
  setInitiator: (p) => { set({ initiator: p }); get().reset(); },
  setSpeed: (ms) => set({ speed: ms }),
  setPlaying: (p) => set({ playing: p }),
  loadExample: () => {
    set({ n: 4, links: allLinks(idsFor(4)), initiator: "P1" });
    get().reset();
  },
  clearLog: () => set({ state: { ...get().state, log: [] } }),
  dismiss: () => set({ error: null }),
}));
