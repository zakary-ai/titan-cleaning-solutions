import { Link, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getUnreadIssueCount } from "@/lib/issues.functions";
import { useMessageNotifications } from "@/hooks/use-message-notifications";

export type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Show unread-messages badge on this item */
  showUnread?: boolean;
};

export function RoleShell({ items, brandSubtitle, children }: { items: NavItem[]; brandSubtitle: string; children: ReactNode }) {
  const { signOut, profile } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const indexRoutes = new Set(items.filter((it) => !it.to.slice(1).includes("/") || items.some((other) => other !== it && other.to.startsWith(it.to + "/"))).map((it) => it.to));
  const isActive = (to: string) =>
    indexRoutes.has(to) ? path === to : path === to || path.startsWith(to + "/");

  const unreadFn = useServerFn(getUnreadIssueCount);
  const { data: unread } = useQuery({
    queryKey: ["unread-issues"],
    queryFn: () => unreadFn(),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
  const unreadCount = unread?.count ?? 0;
  const issuesItem = items.find((it) => it.showUnread);
  useMessageNotifications(unreadCount, issuesItem?.to ?? "/");

  const renderBadge = (variant: "sidebar" | "tab") => {
    if (unreadCount <= 0) return null;
    const label = unreadCount > 99 ? "99+" : String(unreadCount);
    return variant === "sidebar" ? (
      <span className="ml-auto inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-semibold text-destructive-foreground">
        {label}
      </span>
    ) : (
      <span className="absolute -top-1 right-1/2 translate-x-[14px] inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-semibold leading-none text-destructive-foreground">
        {label}
      </span>
    );
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Sidebar (md+) */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-sidebar md:flex md:flex-col">
        <div className="flex items-center gap-3 px-5 py-6">
          <img src="/icon-512.png" alt="Titan Solutions" className="h-10 w-10 object-contain" />
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
              <span>{it.label}</span>
              {it.showUnread && renderBadge("sidebar")}
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
      <header
        className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-sidebar/95 backdrop-blur px-4 pb-2 md:hidden"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.25rem)" }}
      >
        <div className="flex items-center gap-2">
          <img src="/icon-512.png" alt="Titan Solutions" className="h-7 w-7 object-contain" />
          <span className="font-display text-base">Titan</span>
          <span className="text-[10px] uppercase tracking-[0.18em] text-gold">{brandSubtitle}</span>
        </div>
        <Button size="icon" variant="ghost" onClick={signOut} aria-label="Sign out">
          <LogOut className="h-4 w-4" />
        </Button>
      </header>

      {/* Content */}
      <main className="flex-1 pb-24 md:pb-0">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10">
          {children}
        </div>
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-sidebar/95 backdrop-blur md:hidden">

        <div className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
          {items.map((it) => (
            <Link key={it.to} to={it.to}
              className={cn(
                "relative flex flex-col items-center gap-1 py-2.5 text-[10px] leading-tight text-center px-1",
                isActive(it.to) ? "text-gold" : "text-muted-foreground"
              )}>
              <div className="relative">
                <it.icon className="h-5 w-5" />
                {it.showUnread && renderBadge("tab")}
              </div>
              <span className="truncate max-w-full">{it.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
