import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getAdminOverview } from "@/lib/analytics.functions";
import { CheckCircle2, AlertTriangle, MessageSquare, MessagesSquare } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminOverview,
});

function StatCard({ icon: Icon, label, value, tone = "default" }: any) {
  const tones: Record<string, string> = {
    default: "text-gold",
    danger: "text-destructive",
    success: "text-[oklch(0.7_0.15_145)]",
  };
  return (
    <div className="rounded-xl bg-card p-5 gold-border">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className={`h-4 w-4 ${tones[tone]}`} />
      </div>
      <div className="mt-3 font-display text-3xl">{value}</div>
    </div>
  );
}

function AdminOverview() {
  const fn = useServerFn(getAdminOverview);
  const { data } = useQuery({ queryKey: ["admin-overview"], queryFn: () => fn() });
  return (
    <div>
      <h1 className="font-display text-3xl">Operations Overview</h1>
      <p className="mt-1 text-sm text-muted-foreground">Tonight's activity across all properties.</p>
      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={CheckCircle2} label="Properties completed today" value={data?.propertiesCompletedToday ?? "—"} tone="success" />
        <StatCard icon={AlertTriangle} label="Properties missing today" value={data?.propertiesMissingToday ?? "—"} tone="danger" />
        <StatCard icon={MessageSquare} label="Open comments" value={data?.openIssues ?? "—"} />
        <StatCard icon={MessagesSquare} label="Comments this week" value={data?.commentsThisWeek ?? "—"} />
      </div>
    </div>
  );
}
