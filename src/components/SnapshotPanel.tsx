import { CheckCircle2, Hourglass } from "lucide-react";
import { snapshotSum, type SimState } from "@/lib/cl-engine";

export function progress(s: SimState) {
  const total = s.procs.length + s.links.length;
  const done = s.procs.filter((p) => p.recorded !== null).length + s.links.filter((l) => s.rec[l]?.done).length;
  return { done, total, pct: Math.round((done / total) * 100) };
}

export function SnapshotPanel({ s }: { s: SimState }) {
  const { sum, local, ch } = snapshotSum(s);
  const pr = progress(s);
  return (
    <div className="space-y-5">
      <div>
        <div className="mb-1 flex justify-between text-xs text-muted-foreground">
          <span>Snapshot progress</span><span>{pr.done}/{pr.total} recorded</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-recorded transition-all duration-500" style={{ width: `${pr.pct}%` }} />
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Local states (processes)</h4>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {s.procs.map((p) => (
            <div key={p.id} className={`rounded-lg border p-3 ${p.recorded !== null ? "border-recorded/60 bg-recorded/10" : "border-border"}`}>
              <div className="text-sm font-semibold">{p.id}</div>
              <div className="font-mono text-lg">{p.recorded ?? "—"}</div>
              <div className="text-[11px] text-muted-foreground">{p.recorded !== null ? "recorded balance" : "not recorded"}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Channel states (in-transit messages)</h4>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {s.links.map((l) => {
            const r = s.rec[l];
            return (
              <div key={l} className={`rounded-lg border border-dashed p-2 font-mono text-xs ${r?.done ? "border-recorded/60" : r?.recording ? "border-transit/70" : "border-border"}`}>
                <div className="text-muted-foreground">{l}</div>
                <div className={r?.msgs.length ? "text-transit" : ""}>
                  {r ? (r.msgs.length ? `[${r.msgs.join(", ")}]` : "∅ empty") : "—"}
                  {r?.recording && <span className="ml-1 text-transit">recording…</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {s.complete ? (
        <div className="rounded-xl border border-recorded/60 bg-recorded/10 p-4">
          <div className="flex items-center gap-2 font-semibold text-recorded"><CheckCircle2 className="h-5 w-5" />Consistent global snapshot captured</div>
          <p className="mt-2 text-sm text-muted-foreground">
            Recorded balances ({local}) + money captured in channels ({ch}) = <b className="text-foreground">{sum}</b>, exactly the
            system total of {s.total}. Nothing was lost or counted twice: every message recorded as received was also recorded as
            sent, and messages sent before a sender's snapshot but received after the receiver's snapshot appear in channel state.
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl border border-border p-4 text-sm text-muted-foreground">
          <Hourglass className="h-4 w-4" />
          {s.started ? "Snapshot in progress — waiting for markers to reach every channel." : "No snapshot yet. Step through the simulation to start one."}
        </div>
      )}
    </div>
  );
}
