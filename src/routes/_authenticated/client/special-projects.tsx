import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listMyProperties } from "@/lib/uploads.functions";
import { ClientPropertyHeader } from "@/components/client-report";
import { SpecialProjectsCalendar } from "@/components/special-projects-view";

export const Route = createFileRoute("/_authenticated/client/special-projects")({
  component: ClientSpecialProjects,
});

function ClientSpecialProjects() {
  const propsFn = useServerFn(listMyProperties);
  const { data: properties = [] } = useQuery({
    queryKey: ["client-properties"],
    queryFn: () => propsFn(),
  });
  const property = (properties as any[])[0];
  if (!property) {
    return <p className="text-sm text-muted-foreground">No property assigned yet.</p>;
  }
  return (
    <div className="space-y-6">
      <ClientPropertyHeader property_id={property.id} />
      <SpecialProjectsCalendar property_id={property.id} mode="client" issuesLinkTo="/client/issues" />
    </div>
  );
}
