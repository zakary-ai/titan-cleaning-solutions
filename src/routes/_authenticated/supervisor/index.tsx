import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listMyProperties } from "@/lib/uploads.functions";
import { MapPin, ArrowRight, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_authenticated/supervisor/")({
  component: SupervisorHome,
});

function SupervisorHome() {
  const fn = useServerFn(listMyProperties);
  const { data: properties = [] } = useQuery({ queryKey: ["my-properties"], queryFn: () => fn() });
  const today = new Date().toISOString().slice(0, 10);
  const [submittedIds, setSubmittedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const next = new Set<string>();
    for (const p of properties as any[]) {
      try {
        if (localStorage.getItem(`submitted:${p.id}:${today}`) === "1") next.add(p.id);
      } catch {}
    }
    setSubmittedIds(next);
  }, [properties, today]);

  return (
    <div>
      <h1 className="font-display text-3xl">Tonight's Properties</h1>
      <p className="mt-1 text-sm text-muted-foreground">Select a property to begin your nightly proof-of-work.</p>
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {(properties as any[]).map((p) => {
          const submitted = submittedIds.has(p.id);
          return (
            <Link
              key={p.id}
              to="/supervisor/property/$id"
              params={{ id: p.id }}
              className="flex items-center justify-between rounded-xl bg-card p-5 gold-border hover:gold-glow"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-lg truncate">{p.name}</h3>
                  {submitted && <CheckCircle2 className="h-5 w-5 text-[oklch(0.7_0.15_145)]" />}
                </div>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {p.address || "—"}
                </div>
              </div>
              {submitted ? (
                <span className="rounded-md border border-gold/40 px-3 py-1.5 text-xs text-gold">
                  Update report
                </span>
              ) : (
                <ArrowRight className="h-5 w-5 text-gold" />
              )}
            </Link>
          );
        })}
        {properties.length === 0 && (
          <p className="text-sm text-muted-foreground">No properties assigned to you yet.</p>
        )}
      </div>
    </div>
  );
}
