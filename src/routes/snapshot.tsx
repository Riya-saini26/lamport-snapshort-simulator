import { createFileRoute, Link } from "@tanstack/react-router";
import { SnapshotPanel } from "@/components/SnapshotPanel";
import { useSim } from "@/lib/sim-store";

export const Route = createFileRoute("/snapshot")({
  head: () => ({
    meta: [
      { title: "Global Snapshot — Chandy–Lamport Simulator" },
      { name: "description", content: "Recorded process and channel states of the current simulation." },
      { property: "og:title", content: "Global Snapshot — Chandy–Lamport Simulator" },
      { property: "og:description", content: "Inspect recorded local states and channel states." },
    ],
  }),
  component: SnapshotPage,
});

function SnapshotPage() {
  const s = useSim((x) => x.state);
  const transit = Object.entries(s.inTransitAtSnapshot);
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold">Global <span className="text-gradient">Snapshot</span></h1>
      <p className="mt-2 text-muted-foreground">
        Live view of the snapshot from the <Link to="/simulator" className="text-accent underline">simulator</Link>. Local state
        is what a process owned when it recorded; channel state is what was still travelling.
      </p>
      <div className="glass mt-6 p-6"><SnapshotPanel s={s} /></div>
      <div className="glass mt-6 p-6">
        <h2 className="font-semibold">Application messages in transit when the snapshot started</h2>
        {transit.length ? (
          <ul className="mt-2 space-y-1 font-mono text-sm">
            {transit.map(([k, v]) => <li key={k}>{k}: [{v.join(", ")}]</li>)}
          </ul>
        ) : <p className="mt-2 text-sm text-muted-foreground">{s.started ? "None." : "Snapshot not started yet."}</p>}
      </div>
    </main>
  );
}
