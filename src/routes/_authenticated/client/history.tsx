import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listMyProperties, listServiceDates } from "@/lib/uploads.functions";
import { ClientReport, ClientPropertyHeader } from "@/components/client-report";
import { Calendar } from "@/components/ui/calendar";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/client/history")({
  component: ClientHistory,
});

function ClientHistory() {
  const propsFn = useServerFn(listMyProperties);
  const datesFn = useServerFn(listServiceDates);
  const { data: properties = [] } = useQuery({ queryKey: ["client-properties"], queryFn: () => propsFn() });
  const property = properties[0];

  const { data: dates = [] } = useQuery({
    queryKey: ["service-dates", property?.id],
    queryFn: () => datesFn({ data: { property_id: property!.id } }),
    enabled: !!property,
  });

  const dateSet = useMemo(() => new Set(dates as string[]), [dates]);
  const reportDays = useMemo(
    () => (dates as string[]).map((d) => new Date(d + "T00:00:00")),
    [dates]
  );

  const [selected, setSelected] = useState<Date | undefined>();

  if (!property) {
    return <p className="text-sm text-muted-foreground">No property assigned yet.</p>;
  }

  const selectedStr = selected ? format(selected, "yyyy-MM-dd") : undefined;
  const hasReport = selectedStr ? dateSet.has(selectedStr) : false;

  return (
    <div className="space-y-6">
      <ClientPropertyHeader property_id={property.id} />

      <div className="rounded-2xl bg-card p-4 gold-border">
        <h2 className="font-display text-lg">Pick a day</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Days with a report are highlighted in gold.
        </p>
        <div className="mt-3 flex justify-center">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={setSelected}
            modifiers={{ hasReport: reportDays }}
            modifiersClassNames={{
              hasReport: "bg-gold/15 text-gold font-semibold rounded-md",
            }}
            disabled={(date) => !dateSet.has(format(date, "yyyy-MM-dd"))}
            className={cn("p-3 pointer-events-auto")}
          />
        </div>
      </div>

      {selectedStr && hasReport ? (
        <ClientReport property_id={property.id} service_date={selectedStr} />
      ) : selectedStr ? (
        <p className="text-sm text-muted-foreground">No report on {format(selected!, "PPP")}.</p>
      ) : (
        <p className="text-sm text-muted-foreground">Select a highlighted day to view that night's report.</p>
      )}
    </div>
  );
}
