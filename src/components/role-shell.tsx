import { Link, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type NavItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }> };

export function RoleShell({ items, brandSubtitle, children }: { items: NavItem[]; brandSubtitle: string; children: ReactNode }) {
  const { signOut, profile } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string) => path === to || path.startsWith(to + "/");

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Sidebar (md+) */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-sidebar md:flex md:flex-col">
        <div className="flex items-center gap-2 px-5 py-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold/10 text-gold">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display text-lg leading-tight">Titan</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-gold">{brandSubtitle}</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {items.map((it) => (
            <Link key={it.to} to={it.to}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                isActive(it.to)
                  ? "bg-gold/10 text-gold"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}>
              <it.icon className="h-4 w-4" />
              {it.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-border p-4">
          <div className="mb-2 truncate text-xs text-muted-foreground">{profile?.email}</div>
          <Button variant="outline" size="sm" className="w-full" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="flex items-center justify-between border-b border-border bg-sidebar px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-gold" />
          <span className="font-display text-base">Titan</span>
          <span className="text-[10px] uppercase tracking-[0.18em] text-gold">{brandSubtitle}</span>
        </div>
        <Button size="icon" variant="ghost" onClick={signOut} aria-label="Sign out">
          <LogOut className="h-4 w-4" />
        </Button>
      </header>

      {/* Content */}
      <main className="flex-1 pb-20 md:pb-0">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10">
          {children}
        </div>
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-sidebar/95 backdrop-blur md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
          {items.map((it) => (
            <Link key={it.to} to={it.to}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[10px] leading-tight text-center px-1",
                isActive(it.to) ? "text-gold" : "text-muted-foreground"
              )}>
              <it.icon className="h-5 w-5" />
              <span className="truncate max-w-full">{it.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
