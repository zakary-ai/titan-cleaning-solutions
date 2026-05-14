import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listMyProperties } from "@/lib/uploads.functions";
import { MapPin, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/supervisor/")({
  component: SupervisorHome,
});

function SupervisorHome() {
  const fn = useServerFn(listMyProperties);
  const { data: properties = [] } = useQuery({ queryKey: ["my-properties"], queryFn: () => fn() });
  return (
    <div>
      <h1 className="font-display text-3xl">Tonight's Properties</h1>
      <p className="mt-1 text-sm text-muted-foreground">Select a property to begin your nightly proof-of-work.</p>
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {properties.map((p: any) => (
          <Link key={p.id} to="/supervisor/property/$id" params={{ id: p.id }}
            className="flex items-center justify-between rounded-xl bg-card p-5 gold-border hover:gold-glow">
            <div>
              <h3 className="font-display text-lg">{p.name}</h3>
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" /> {p.address || "—"}
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-gold" />
          </Link>
        ))}
        {properties.length === 0 && (
          <p className="text-sm text-muted-foreground">No properties assigned to you yet.</p>
        )}
      </div>
    </div>
  );
}
