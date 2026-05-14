import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listMyProperties } from "@/lib/uploads.functions";
import { ClientReport, ClientPropertyHeader } from "@/components/client-report";

export const Route = createFileRoute("/_authenticated/client/")({
  component: ClientToday,
});

function ClientToday() {
  const fn = useServerFn(listMyProperties);
  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["client-properties"],
    queryFn: () => fn(),
  });

  const property = properties[0];

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!property) {
    return (
      <div className="rounded-2xl bg-card p-6 gold-border">
        <h1 className="font-display text-xl">No property assigned yet</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account isn't linked to a property yet. Please contact Titan Solutions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ClientPropertyHeader property_id={property.id} />
      <ClientReport property_id={property.id} />
    </div>
  );
}
