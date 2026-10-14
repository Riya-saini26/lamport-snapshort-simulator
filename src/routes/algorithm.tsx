import { createFileRoute, Link } from "@tanstack/react-router";
import { PSEUDOCODE } from "@/lib/cl-engine";

export const Route = createFileRoute("/algorithm")({
  head: () => ({
    meta: [
      { title: "Learn the Algorithm — Chandy–Lamport Simulator" },
      { name: "description", content: "Beginner-friendly explanation of the Chandy–Lamport snapshot algorithm with pseudocode and a worked example." },
      { property: "og:title", content: "Learn the Chandy–Lamport Algorithm" },
      { property: "og:description", content: "Markers, global state, in-transit messages and consistency explained simply." },
    ],
  }),
  component: Algorithm,
});

const qa = [
  ["What is a distributed system?", "A group of independent computers (processes) that cooperate only by sending messages. They share no memory and no common clock."],
  ["What is a global state?", "The local state of every process plus the messages still travelling on every channel, taken together."],
  ["Why is a snapshot difficult?", "Nobody can see all processes at the same instant. If each process just records 'now', a message might be counted as received but never sent — or lost entirely."],
  ["What is the Chandy–Lamport algorithm?", "A 1985 algorithm that records a consistent global state while the system keeps running, using special marker messages over FIFO channels."],
  ["What is a marker message?", "A control message, not application data. It separates messages sent before the sender's snapshot from those sent after it."],
  ["What is a consistent snapshot?", "One where every received message recorded is also recorded as sent. It corresponds to a state the system could really have been in."],
  ["How are in-transit messages recorded?", "After recording itself, a process logs every message arriving on an incoming channel until the marker on that channel arrives. Those messages are the channel's state."],
  ["Applications and limitations", "Used for checkpointing, deadlock and termination detection, and debugging (e.g. Apache Flink). Requires reliable FIFO channels, a strongly-connected network, and adds marker traffic."],
];

const glossary = [
  ["Process", "An independent participant with its own local state."],
  ["Channel", "A one-way, reliable FIFO link between two processes."],
  ["Initiator", "The process that starts the snapshot."],
  ["Marker", "Control message that triggers and bounds recording."],
  ["Channel state", "Messages in transit captured during recording."],
  ["FIFO", "First in, first out — messages arrive in send order."],
];

function Algorithm() {
  return (
    <main className="mx-auto max-w-5xl space-y-10 px-4 py-10">
      <div>
        <h1 className="text-3xl font-bold">Learn the <span className="text-gradient">Algorithm</span></h1>
        <p className="mt-2 text-muted-foreground">Everything you need for a viva, in plain language.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {qa.map(([q, a]) => (
          <div key={q} className="glass p-5"><h3 className="font-semibold text-accent">{q}</h3><p className="mt-2 text-sm text-muted-foreground">{a}</p></div>
        ))}
      </div>
      <section className="glass p-6">
        <h2 className="text-xl font-semibold">Pseudocode</h2>
        <ol className="mt-3 space-y-1 font-mono text-sm">
          {PSEUDOCODE.map((l, i) => <li key={i} className="whitespace-pre"><span className="mr-3 text-muted-foreground">{i + 1}</span>{l}</li>)}
        </ol>
      </section>
      <section className="glass p-6">
        <h2 className="text-xl font-semibold">Worked example (the simulator's default run)</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          <li>Each of P1–P4 starts with 100. P1 sends 10 to P2, P3 sends 5 to P1, P2 sends 7 to P4.</li>
          <li>P1 starts the snapshot: it records 90 and sends markers to P2, P3, P4.</li>
          <li>The 5 from P3 now reaches P1. P1 has recorded but not yet seen a marker from P3, so 5 is captured as the state of channel P3 → P1.</li>
          <li>Markers arrive everywhere; each process records itself on its first marker and closes channels on later ones.</li>
          <li>Sum of recorded balances + channel states = 400. Consistent!</li>
        </ol>
        <Link to="/simulator" className="btn btn-primary mt-5">Try it in the simulator</Link>
      </section>
      <section>
        <h2 className="mb-3 text-xl font-semibold">Glossary</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {glossary.map(([t, d]) => <div key={t} className="glass p-4"><b>{t}</b><p className="text-sm text-muted-foreground">{d}</p></div>)}
        </div>
      </section>
    </main>
  );
}
