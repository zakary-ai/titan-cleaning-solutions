import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listMyProperties, listServiceDates } from "@/lib/uploads.functions";
import { ClientReport, ClientPropertyHeader } from "@/components/client-report";
import { Calendar } from "@/components/ui/calendar";
import { ArrowLeft, MapPin } from "lucide-react";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/supervisor/history")({
  component: SupervisorHistory,
});

function SupervisorHistory() {
  const propsFn = useServerFn(listMyProperties);
  const { data: properties = [] } = useQuery({ queryKey: ["my-properties"], queryFn: () => propsFn() });

  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const property = properties.find((p: any) => p.id === selectedPropertyId);

  return (
    <div>
      <h1 className="font-display text-3xl">History</h1>
      <p className="mt-1 text-sm text-muted-foreground">View past submissions by property.</p>

      {!property ? (
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {(properties as any[]).map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPropertyId(p.id)}
              className="flex items-center justify-between rounded-xl bg-card p-5 gold-border hover:gold-glow text-left"
            >
              <div className="min-w-0">
                <h3 className="font-display text-lg truncate">{p.name}</h3>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {p.address || "—"}
                </div>
              </div>
              <ArrowLeft className="h-5 w-5 text-gold rotate-180" />
            </button>
          ))}
          {properties.length === 0 && (
            <p className="text-sm text-muted-foreground">No properties assigned to you yet.</p>
          )}
        </div>
      ) : (
        <PropertyHistoryView property={property} onBack={() => setSelectedPropertyId(null)} />
      )}
    </div>
  );
}

function PropertyHistoryView({ property, onBack }: { property: any; onBack: () => void }) {
  const datesFn = useServerFn(listServiceDates);
  const { data: dates = [] } = useQuery({
    queryKey: ["service-dates", property.id],
    queryFn: () => datesFn({ data: { property_id: property.id } }),
  });

  const dateSet = useMemo(() => new Set(dates as string[]), [dates]);
  const reportDays = useMemo(
    () => (dates as string[]).map((d) => new Date(d + "T00:00:00")),
    [dates]
  );
  const [selected, setSelected] = useState<Date | undefined>();

  const selectedStr = selected ? format(selected, "yyyy-MM-dd") : undefined;
  const hasReport = selectedStr ? dateSet.has(selectedStr) : false;

  return (
    <div className="mt-6 space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-gold"
      >
        <ArrowLeft className="mr-1 h-3 w-3" /> Back to properties
      </button>

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
        <p className="text-sm text-muted-foreground">Select a highlighted day to view that night&apos;s report.</p>
      )}
    </div>
  );
}
