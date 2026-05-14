import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getAdminAnalytics } from "@/lib/analytics.functions";
import { Progress } from "@/components/ui/progress";
import { ChevronRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const fn = useServerFn(getAdminAnalytics);
  const { data = [] } = useQuery({ queryKey: ["admin-analytics"], queryFn: () => fn() });
  return (
    <div>
      <h1 className="font-display text-3xl">Analytics</h1>
      <p className="mt-1 text-sm text-muted-foreground">Last 30 days · upload completion & comment volume per property. Tap a property to view its reports.</p>
      <div className="mt-6 space-y-3">
        {data.map((s: any) => (
          <Link
            key={s.id}
            to="/admin/property/$id/view"
            params={{ id: s.id }}
            className="block rounded-xl bg-card p-5 gold-border transition-colors hover:bg-secondary/40"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-display text-lg">
                {s.name}
                <ChevronRight className="h-4 w-4 text-gold" />
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>{s.total_records} records</span>
                <span className="text-gold">{s.comments} comments</span>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <Progress value={s.completion} className="flex-1" />
              <span className="w-12 text-right text-sm">{s.completion}%</span>
            </div>
          </Link>
        ))}
        {data.length === 0 && <p className="text-sm text-muted-foreground">No data yet.</p>}
      </div>
    </div>
  );
}

