import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ClipboardCheck, CalendarDays, Sparkles, MessageSquare, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

const items = [
  { to: "/demo/client", label: "Today", icon: ClipboardCheck, exact: true },
  { to: "/demo/client/history", label: "History", icon: CalendarDays },
  { to: "/demo/client/specials", label: "Specials", icon: Sparkles },
  { to: "/demo/client/comments", label: "Comments", icon: MessageSquare },
];

export function DemoShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string, exact?: boolean) =>
    exact ? path === to : path === to || path.startsWith(to + "/");

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-sidebar md:flex md:flex-col">
        <div className="flex items-center gap-3 px-5 py-6">
          <img src="/icon-512.png" alt="Titan Solutions" className="h-10 w-10 object-contain" />
          <div>
            <div className="font-display text-lg leading-tight">Titan</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-gold">Client Demo</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {items.map((it) => (
            <Link
              key={it.to}
              to={it.to}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                isActive(it.to, it.exact)
                  ? "bg-gold/10 text-gold"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <it.icon className="h-4 w-4" />
              <span>{it.label}</span>
            </Link>
          ))}
        </nav>
        <div className="border-t border-border p-4">
          <div className="mb-2 text-xs text-muted-foreground">Read-only demo</div>
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link to="/demo">
              <LogOut className="mr-2 h-4 w-4" /> Exit demo
            </Link>
          </Button>
        </div>
      </aside>

      <header
        className="flex items-center justify-between border-b border-border bg-sidebar px-4 py-3 md:hidden"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.75rem)" }}
      >
        <div className="flex items-center gap-2">
          <img src="/icon-512.png" alt="Titan Solutions" className="h-7 w-7 object-contain" />
          <span className="font-display text-base">Titan</span>
          <span className="text-[10px] uppercase tracking-[0.18em] text-gold">Demo</span>
        </div>
        <Button asChild size="icon" variant="ghost" aria-label="Exit demo">
          <Link to="/demo"><LogOut className="h-4 w-4" /></Link>
        </Button>
      </header>

      <main className="flex-1 pb-20 md:pb-0">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10">{children}</div>
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-sidebar/95 backdrop-blur md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
          {items.map((it) => (
            <Link
              key={it.to}
              to={it.to}
              className={cn(
                "relative flex flex-col items-center gap-1 py-2.5 text-[10px] leading-tight text-center px-1",
                isActive(it.to, it.exact) ? "text-gold" : "text-muted-foreground",
              )}
            >
              <it.icon className="h-5 w-5" />
              <span className="truncate max-w-full">{it.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

export function DemoPropertyHeader() {
  return (
    <div>
      <h1 className="font-display text-2xl md:text-3xl">Demo Hotel</h1>
      <p className="text-sm text-muted-foreground">123 Example Ave, Sample City</p>
      <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-gold">Read-only demo</p>
    </div>
  );
}
