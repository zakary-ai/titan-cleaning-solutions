import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listServiceDates } from "@/lib/uploads.functions";
import { ClientReport, ClientPropertyHeader } from "@/components/client-report";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/property/$id/view")({
  component: AdminPropertyView,
});

function AdminPropertyView() {
  const { id } = Route.useParams();
  const datesFn = useServerFn(listServiceDates);
  const { data: dates = [] } = useQuery({
    queryKey: ["service-dates", id],
    queryFn: () => datesFn({ data: { property_id: id } }),
  });

  const dateSet = useMemo(() => new Set(dates as string[]), [dates]);
  const reportDays = useMemo(
    () => (dates as string[]).map((d) => new Date(d + "T00:00:00")),
    [dates],
  );

  const [selected, setSelected] = useState<Date | undefined>();
  const selectedStr = selected ? format(selected, "yyyy-MM-dd") : undefined;
  const hasReport = selectedStr ? dateSet.has(selectedStr) : false;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/admin/analytics">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to analytics
        </Link>
      </Button>

      <ClientPropertyHeader property_id={id} />

      <section>
        <h2 className="font-display text-xl">Most recent report</h2>
        <div className="mt-3">
          <ClientReport property_id={id} />
        </div>
      </section>

      <section className="rounded-2xl bg-card p-4 gold-border">
        <h2 className="font-display text-lg">History</h2>
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
      </section>

      {selectedStr && hasReport ? (
        <ClientReport property_id={id} service_date={selectedStr} />
      ) : selectedStr ? (
        <p className="text-sm text-muted-foreground">No report on {format(selected!, "PPP")}.</p>
      ) : null}
    </div>
  );
}
