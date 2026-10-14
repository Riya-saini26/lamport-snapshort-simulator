import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About the Project — Chandy–Lamport Simulator" },
      { name: "description", content: "Objectives, technology and learning outcomes of the Chandy–Lamport simulator." },
      { property: "og:title", content: "About the Chandy–Lamport Simulator" },
      { property: "og:description", content: "Objectives, technology stack and learning outcomes." },
    ],
  }),
  component: About,
});

const blocks = [
  { t: "Objectives", items: ["Make the Chandy–Lamport algorithm visible and tangible", "Demonstrate consistent global state capture", "Support live demos and viva presentations"] },
  { t: "Technology", items: ["React 19 + TypeScript", "TanStack Start & Router", "Tailwind CSS v4", "Zustand state store", "Custom animated SVG network", "Lucide icons"] },
  { t: "Learning outcomes", items: ["Explain markers and FIFO channels", "Identify in-transit messages", "Verify snapshot consistency by conservation", "Reason about initiators and topologies"] },
];

function About() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold">About the <span className="text-gradient">Project</span></h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        A browser-only educational tool. The algorithm engine is a pure, deterministic module separate from the interface,
        so every demonstration is reproducible and every step can be undone.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {blocks.map((b) => (
          <div key={b.t} className="glass p-6">
            <h2 className="font-semibold text-accent">{b.t}</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">{b.items.map((i) => <li key={i}>• {i}</li>)}</ul>
          </div>
        ))}
      </div>
    </main>
  );
}
