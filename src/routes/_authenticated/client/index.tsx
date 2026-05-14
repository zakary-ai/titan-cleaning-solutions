import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listMyProperties } from "@/lib/uploads.functions";
import { ArrowRight, Building2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/client/")({
  component: ClientHome,
});

function ClientHome() {
  const fn = useServerFn(listMyProperties);
  const { data: properties = [] } = useQuery({ queryKey: ["client-properties"], queryFn: () => fn() });
  return (
    <div>
      <div className="rounded-2xl bg-gradient-to-br from-card to-secondary p-8 gold-glow">
        <div className="text-xs uppercase tracking-[0.18em] text-gold">Welcome</div>
        <h1 className="mt-2 font-display text-3xl md:text-4xl">Your nightly cleaning reports</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Review last night's proof-of-work for each property and area. Leave a comment if anything needs attention.
        </p>
      </div>

      <h2 className="mt-8 font-display text-xl">Properties</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {properties.map((p: any) => (
          <Link key={p.id} to="/client/property/$id" params={{ id: p.id }}
            className="group flex items-center justify-between rounded-xl bg-card p-5 gold-border hover:gold-glow">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gold/10 p-2 text-gold"><Building2 className="h-5 w-5" /></div>
              <div>
                <div className="font-display text-lg">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.address || "—"}</div>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-gold transition group-hover:translate-x-0.5" />
          </Link>
        ))}
        {properties.length === 0 && (
          <p className="text-sm text-muted-foreground">No properties assigned to your organization yet.</p>
        )}
      </div>
    </div>
  );
}
