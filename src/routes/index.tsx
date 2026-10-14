import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, BookOpen, Camera, GitBranch, Layers, Play, ShieldCheck, Sparkles, StepForward } from "lucide-react";
import { useSim } from "@/lib/sim-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Chandy–Lamport Snapshot Simulator — Visualize distributed state" },
      { name: "description", content: "Explore how distributed processes capture a consistent global state without stopping the system." },
      { property: "og:title", content: "Chandy–Lamport Snapshot Simulator" },
      { property: "og:description", content: "Visualize the invisible state of a distributed system." },
    ],
  }),
  component: Index,
});

const features = [
  { icon: GitBranch, t: "Interactive Distributed Network", d: "Processes and FIFO channels you can configure." },
  { icon: Activity, t: "Real-Time Message Animation", d: "Watch messages and markers travel the links." },
  { icon: Camera, t: "Global State Capture", d: "Local states recorded the moment markers arrive." },
  { icon: Layers, t: "Channel State Visualization", d: "See in-transit messages land in channel state." },
  { icon: StepForward, t: "Step-by-Step Execution", d: "Step forward, rewind and replay every event." },
  { icon: ShieldCheck, t: "Consistent Snapshot Detection", d: "Automatic proof that the snapshot is consistent." },
];

function BgNetwork() {
  const pts = [[80, 90], [300, 40], [520, 120], [460, 320], [180, 300], [320, 200]];
  const edges = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [5, 0], [5, 2], [5, 3], [1, 5]];
  return (
    <svg viewBox="0 0 600 380" className="pointer-events-none absolute inset-0 h-full w-full opacity-40" preserveAspectRatio="xMidYMid slice">
      {edges.map(([a, b], i) => (
        <line key={i} x1={pts[a][0]} y1={pts[a][1]} x2={pts[b][0]} y2={pts[b][1]} stroke="var(--primary)" strokeOpacity=".5" strokeDasharray="4 6" className="anim-dash" />
      ))}
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="7" fill="var(--accent)" className="anim-pulse" style={{ animationDelay: `${i * 0.4}s` }} />
      ))}
    </svg>
  );
}

function Index() {
  const loadExample = useSim((s) => s.loadExample);
  return (
    <main>
      <section className="relative overflow-hidden">
        <BgNetwork />
        <div className="relative mx-auto max-w-4xl px-4 py-28 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-accent" /> Distributed Snapshot Algorithm · 1985
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-6xl">
            Chandy–Lamport <span className="text-gradient">Snapshot Simulator</span>
          </h1>
          <p className="mt-4 text-xl text-accent">Visualize the invisible state of a distributed system.</p>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Explore how distributed processes capture a consistent global state without stopping the system or relying on a global clock.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/simulator" className="btn btn-primary"><Play className="h-4 w-4" />Start Simulation</Link>
            <Link to="/algorithm" className="btn"><BookOpen className="h-4 w-4" />Learn the Algorithm</Link>
            <Link to="/simulator" onClick={loadExample} className="btn"><Camera className="h-4 w-4" />Explore Example</Link>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-4 px-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div key={f.t} className="glass p-6 transition hover:-translate-y-1 hover:border-primary/60">
            <f.icon className="h-6 w-6 text-accent" />
            <h3 className="mt-4 font-semibold">{f.t}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
