import { chEnds, type SimState } from "@/lib/cl-engine";

const W = 560, H = 420, R = 150, NODE = 34;

export function NetworkView({ s }: { s: SimState }) {
  const pos: Record<string, { x: number; y: number }> = {};
  s.procs.forEach((p, i) => {
    const a = (i / s.procs.length) * Math.PI * 2 - Math.PI / 2;
    pos[p.id] = { x: Math.round(W / 2 + R * Math.cos(a) * 1.35), y: Math.round(H / 2 + R * Math.sin(a)) };
  });

  const geom = (k: string) => {
    const [a, b] = chEnds(k);
    const A = pos[a]!, B = pos[b]!;
    const dx = B.x - A.x, dy = B.y - A.y, len = Math.hypot(dx, dy);
    const ux = dx / len, uy = dy / len, nx = -uy * 9, ny = ux * 9;
    const sx = A.x + ux * NODE + nx, sy = A.y + uy * NODE + ny;
    const ex = B.x - ux * (NODE + 6) + nx, ey = B.y - uy * (NODE + 6) + ny;
    return { sx, sy, ex, ey };
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full">
      <defs>
        {["app", "marker", "recorded", "muted"].map((c) => (
          <marker key={c} id={`arr-${c}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill={c === "muted" ? "var(--muted-foreground)" : `var(--${c})`} />
          </marker>
        ))}
      </defs>
      {s.links.map((k) => {
        const g = geom(k);
        const r = s.rec[k];
        const color = r?.done ? "recorded" : r?.recording ? "transit" : "muted";
        const active = s.lastCh === k;
        return (
          <g key={k}>
            <line x1={g.sx} y1={g.sy} x2={g.ex} y2={g.ey}
              stroke={color === "muted" ? "var(--muted-foreground)" : `var(--${color})`}
              strokeOpacity={active ? 1 : color === "muted" ? 0.3 : 0.8}
              strokeWidth={active ? 2.5 : 1.5}
              strokeDasharray={r?.recording ? "6 4" : undefined}
              className={r?.recording ? "anim-dash" : undefined}
              markerEnd={`url(#arr-${color === "transit" ? "app" : color})`}>
            </line>
          </g>
        );
      })}
      {s.links.flatMap((k) => {
        const g = geom(k);
        return (s.channels[k] ?? []).map((m, i) => {
          const t = Math.max(0.15, 0.78 - i * 0.14);
          const x = g.sx + (g.ex - g.sx) * t, y = g.sy + (g.ey - g.sy) * t;
          return (
            <g key={m.id} style={{ transform: `translate(${x}px, ${y}px)`, transition: "transform 500ms ease" }}>
              {m.kind === "app" ? (
                <>
                  <circle r="10" fill="var(--app)" />
                  <text textAnchor="middle" dy="3.5" fontSize="9" fontWeight="700" fill="var(--background)">{m.amount}</text>
                </>
              ) : (
                <rect x="-7" y="-7" width="14" height="14" transform="rotate(45)" fill="var(--marker)" stroke="var(--foreground)" strokeWidth="1" />
              )}
            </g>
          );
        });
      })}
      {s.procs.map((p) => {
        const { x, y } = pos[p.id]!;
        const rec = p.recorded !== null;
        return (
          <g key={p.id} transform={`translate(${x},${y})`}>
            {rec && <circle r={NODE + 7} fill="none" stroke="var(--recorded)" strokeWidth="2" className="anim-pulse" />}
            <circle r={NODE} fill="var(--popover)" stroke={rec ? "var(--recorded)" : s.initiator === p.id ? "var(--marker)" : "var(--primary)"} strokeWidth="2.5" />
            <text textAnchor="middle" dy="-3" fontSize="15" fontWeight="700" fill="var(--foreground)">{p.id}</text>
            <text textAnchor="middle" dy="13" fontSize="11" fill="var(--muted-foreground)" fontFamily="var(--font-mono)">{p.balance}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function Legend() {
  const row = "flex items-center gap-2 text-xs text-muted-foreground";
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      <div className={row}><span className="h-3 w-3 rounded-full bg-app" />Application message</div>
      <div className={row}><span className="h-3 w-3 rotate-45 bg-marker" />Marker message</div>
      <div className={row}><span className="h-3 w-3 rounded-full border-2 border-recorded" />Process recorded</div>
      <div className={row}><span className="h-0.5 w-5 border-t-2 border-dashed border-transit" />Channel recording</div>
      <div className={row}><span className="h-0.5 w-5 bg-recorded" />Channel recorded</div>
      <div className={row}><span className="h-3 w-3 rounded-full border-2 border-marker" />Initiator</div>
    </div>
  );
}
