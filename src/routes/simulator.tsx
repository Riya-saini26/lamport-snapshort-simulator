import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, ChevronLeft, ChevronRight, FastForward, Minus, Pause, Play, Plus, RotateCcw, Send, Trash2, Undo2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Legend, NetworkView } from "@/components/NetworkView";
import { SnapshotPanel, progress } from "@/components/SnapshotPanel";
import { chEnds, chKey, isFinished, nextAction, PSEUDOCODE } from "@/lib/cl-engine";
import { useSim } from "@/lib/sim-store";

export const Route = createFileRoute("/simulator")({
  head: () => ({
    meta: [
      { title: "Simulator — Chandy–Lamport Snapshot" },
      { name: "description", content: "Step through the Chandy–Lamport algorithm on a live network of processes." },
      { property: "og:title", content: "Chandy–Lamport Interactive Simulator" },
      { property: "og:description", content: "Run, pause and rewind a real distributed snapshot." },
    ],
  }),
  component: Simulator,
});

const toneClass: Record<string, string> = {
  app: "border-app", marker: "border-marker", record: "border-recorded", done: "border-recorded bg-recorded/10", info: "border-primary",
};

function Simulator() {
  const sim = useSim();
  const { state: s, playing, speed } = sim;
  const finished = isFinished(s);
  const cfgErr = sim.configError();
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => { if (!useSim.getState().step()) useSim.getState().setPlaying(false); }, speed);
    return () => clearInterval(t);
  }, [playing, speed]);

  useEffect(() => { logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" }); }, [s.log.length]);

  const ids = s.procs.map((p) => p.id);
  const [from, setFrom] = useState("P1");
  const [to, setTo] = useState("P2");
  const [amt, setAmt] = useState(5);
  const nxt = nextAction(s);
  const pr = progress(s);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Interactive <span className="text-gradient">Simulator</span></h1>
          <p className="text-sm text-muted-foreground">Step {s.step} · initiator {sim.initiator} · snapshot {pr.pct}%</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-primary" disabled={!!cfgErr} onClick={() => { sim.reset(); sim.setPlaying(true); }} title="Restart and run"><Play className="h-4 w-4" />Start</button>
          {playing
            ? <button className="btn" onClick={() => sim.setPlaying(false)}><Pause className="h-4 w-4" />Pause</button>
            : <button className="btn" disabled={finished || s.step === 0} onClick={() => sim.setPlaying(true)}><Play className="h-4 w-4" />Resume</button>}
          <button className="btn" disabled={!sim.history.length} onClick={sim.back}><ChevronLeft className="h-4 w-4" />Previous</button>
          <button className="btn" disabled={finished || playing} onClick={sim.step}>Next<ChevronRight className="h-4 w-4" /></button>
          <button className="btn" disabled={finished || playing} onClick={() => sim.setPlaying(true)}><FastForward className="h-4 w-4" />Run auto</button>
          <button className="btn" onClick={sim.reset}><RotateCcw className="h-4 w-4" />Reset</button>
        </div>
      </div>

      {(sim.error || cfgErr) && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-destructive/60 bg-destructive/10 p-3 text-sm">
          <AlertTriangle className="h-4 w-4 text-destructive" />{sim.error || cfgErr}
          {sim.error && <button className="ml-auto" onClick={sim.dismiss} aria-label="Dismiss"><X className="h-4 w-4" /></button>}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <div className="glass p-4">
            <NetworkView s={s} />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
              <span>Next: <span className="font-mono text-foreground">{nxt ? (nxt.type === "send" ? `send ${nxt.amount} ${nxt.from}→${nxt.to}` : nxt.type === "snapshot" ? `${nxt.by} initiates snapshot` : `deliver head of ${nxt.ch}`) : "nothing — run finished"}</span></span>
              <label className="flex items-center gap-2">Speed
                <input type="range" min={200} max={2000} step={100} value={2200 - speed} onChange={(e) => sim.setSpeed(2200 - +e.target.value)} />
              </label>
            </div>
            <div className="mt-3"><Legend /></div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {s.procs.map((p) => {
              const inc = s.links.filter((l) => chEnds(l)[1] === p.id);
              const out = s.links.filter((l) => chEnds(l)[0] === p.id);
              return (
                <div key={p.id} className={`glass p-4 ${p.recorded !== null ? "border-recorded/60" : ""}`}>
                  <div className="flex items-center justify-between">
                    <b>{p.id}{s.initiator === p.id && <span className="ml-2 text-xs text-marker">initiator</span>}</b>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] ${p.recorded !== null ? "bg-recorded/20 text-recorded" : "bg-muted text-muted-foreground"}`}>
                      {p.recorded !== null ? `recorded ${p.recorded}` : "not recorded"}
                    </span>
                  </div>
                  <dl className="mt-2 grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                    <dt>Local state</dt><dd className="text-right font-mono text-foreground">{p.balance}</dd>
                    <dt>Events</dt><dd className="text-right font-mono">{p.events}</dd>
                    <dt>Sent / received</dt><dd className="text-right font-mono">{p.sent} / {p.recv}</dd>
                    <dt>Incoming queued</dt><dd className="text-right font-mono">{inc.reduce((t, l) => t + s.channels[l].length, 0)}</dd>
                    <dt>Outgoing queued</dt><dd className="text-right font-mono">{out.reduce((t, l) => t + s.channels[l].length, 0)}</dd>
                  </dl>
                </div>
              );
            })}
          </div>

          <div className="glass p-5">
            <h2 className="mb-4 font-semibold">Global snapshot</h2>
            <SnapshotPanel s={s} />
          </div>
        </div>

        <aside className="space-y-6">
          <div className="glass p-4">
            <h2 className="mb-2 font-semibold">Pseudocode</h2>
            <ol className="space-y-0.5 font-mono text-[11.5px]">
              {PSEUDOCODE.map((l, i) => (
                <li key={i} className={`whitespace-pre-wrap rounded px-2 py-1 transition ${s.line === i ? "bg-primary/25 text-foreground" : "text-muted-foreground"}`}>{l}</li>
              ))}
            </ol>
          </div>

          <div className="glass p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-semibold">Event log</h2>
              <button className="text-xs text-muted-foreground hover:text-foreground" onClick={sim.clearLog} title="Clear log"><Trash2 className="h-4 w-4" /></button>
            </div>
            <div ref={logRef} className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {s.log.length === 0 && <p className="text-xs text-muted-foreground">No events yet. Press Next or Start.</p>}
              {s.log.map((e, i) => (
                <div key={i} className={`border-l-2 pl-2 text-xs ${toneClass[e.tone]}`}>
                  <div className="flex justify-between font-mono text-[10px] text-muted-foreground"><span>#{e.step} · {e.proc}</span><span>{e.type}</span></div>
                  <div>{e.text}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass space-y-4 p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Network configuration</h2>
              <button className="btn px-2 py-1 text-xs" onClick={sim.loadExample}><Undo2 className="h-3.5 w-3.5" />Example</button>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Processes</span>
              <div className="flex items-center gap-2">
                <button className="btn p-1" disabled={sim.n <= 2} onClick={() => sim.setN(sim.n - 1)} aria-label="Remove process"><Minus className="h-4 w-4" /></button>
                <span className="w-4 text-center font-mono">{sim.n}</span>
                <button className="btn p-1" disabled={sim.n >= 6} onClick={() => sim.setN(sim.n + 1)} aria-label="Add process"><Plus className="h-4 w-4" /></button>
              </div>
            </div>
            <label className="flex items-center justify-between text-sm">Initiator
              <select className="field" value={sim.initiator} onChange={(e) => sim.setInitiator(e.target.value)}>
                {ids.map((i) => <option key={i}>{i}</option>)}
              </select>
            </label>
            <div>
              <div className="mb-1 text-sm">Channels <span className="text-xs text-muted-foreground">(row → column)</span></div>
              <table className="font-mono text-xs">
                <thead><tr><th />{ids.map((i) => <th key={i} className="px-1 font-normal text-muted-foreground">{i}</th>)}</tr></thead>
                <tbody>
                  {ids.map((a) => (
                    <tr key={a}><td className="pr-2 text-muted-foreground">{a}</td>
                      {ids.map((b) => (
                        <td key={b} className="px-1 text-center">
                          {a !== b && <input type="checkbox" checked={sim.links.includes(chKey(a, b))} onChange={() => sim.toggleLink(chKey(a, b))} title={`${a} → ${b}`} />}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-1 text-[11px] text-muted-foreground">Changing the network resets the simulation.</p>
            </div>
            <div className="border-t border-border pt-3">
              <div className="mb-2 text-sm">Send application message</div>
              <div className="flex flex-wrap items-center gap-2">
                <select className="field" value={from} onChange={(e) => setFrom(e.target.value)}>{ids.map((i) => <option key={i}>{i}</option>)}</select>
                <span>→</span>
                <select className="field" value={to} onChange={(e) => setTo(e.target.value)}>{ids.map((i) => <option key={i}>{i}</option>)}</select>
                <input className="field w-16" type="number" min={1} value={amt} onChange={(e) => setAmt(+e.target.value)} />
                <button className="btn px-2 py-1" disabled={playing} onClick={() => sim.act({ type: "send", from, to, amount: amt })}><Send className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="border-t border-border pt-3">
              <div className="mb-2 text-sm">Deliver a specific channel</div>
              <div className="flex flex-wrap gap-1">
                {s.links.filter((l) => s.channels[l].length).map((l) => (
                  <button key={l} className="btn px-2 py-1 font-mono text-xs" disabled={playing} onClick={() => sim.act({ type: "deliver", ch: l })}>{l} ({s.channels[l].length})</button>
                ))}
                {s.links.every((l) => !s.channels[l].length) && <span className="text-xs text-muted-foreground">All channels empty.</span>}
              </div>
              {!s.started && <button className="btn mt-3 w-full text-xs" disabled={playing || !!cfgErr} onClick={() => sim.act({ type: "snapshot", by: sim.initiator })}>Initiate snapshot now from {sim.initiator}</button>}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
