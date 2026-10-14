import { Link } from "@tanstack/react-router";
import { Menu, Network, X } from "lucide-react";
import { useState } from "react";

const items = [
  { to: "/", label: "Home" },
  { to: "/simulator", label: "Simulator" },
  { to: "/algorithm", label: "Algorithm" },
  { to: "/snapshot", label: "Global Snapshot" },
  { to: "/about", label: "About" },
] as const;

export function SiteNav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <Network className="h-5 w-5 text-accent" />
          <span>Chandy–Lamport <span className="text-gradient">Simulator</span></span>
        </Link>
        <nav className="hidden gap-1 md:flex">
          {items.map((i) => (
            <Link key={i.to} to={i.to} activeOptions={{ exact: true }}
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition hover:text-foreground"
              activeProps={{ className: "bg-secondary text-foreground" }}>
              {i.label}
            </Link>
          ))}
        </nav>
        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <nav className="flex flex-col border-t border-border px-4 py-2 md:hidden">
          {items.map((i) => (
            <Link key={i.to} to={i.to} onClick={() => setOpen(false)} className="py-2 text-sm text-muted-foreground">
              {i.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
