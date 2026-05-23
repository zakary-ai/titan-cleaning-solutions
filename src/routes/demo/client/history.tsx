import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { DemoPropertyHeader } from "@/components/demo/demo-shell";
import { DEMO_AREAS, DEMO_HISTORY, DEMO_HISTORY_DATES } from "@/lib/demo-data";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/demo/client/history")({
  component: DemoHistory,
});

function DemoHistory() {
  const dateSet = useMemo(() => new Set(DEMO_HISTORY_DATES), []);
  const reportDays = useMemo(
    () => DEMO_HISTORY_DATES.map((d) => new Date(d + "T00:00:00")),
    [],
  );
  const [selected, setSelected] = useState<Date | undefined>();
  const selectedStr = selected ? format(selected, "yyyy-MM-dd") : undefined;
  const day = selectedStr ? DEMO_HISTORY[selectedStr] : undefined;

  return (
    <div className="space-y-6">
      <DemoPropertyHeader />

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
            modifiersClassNames={{ hasReport: "bg-gold/15 text-gold font-semibold rounded-md" }}
            disabled={(date) => !dateSet.has(format(date, "yyyy-MM-dd"))}
            className={cn("p-3 pointer-events-auto")}
          />
        </div>
      </div>

      {day ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {DEMO_AREAS.map((a) => {
            const m = day[a.id];
            return (
              <div key={a.id} className="overflow-hidden rounded-xl bg-card gold-border">
                <div className="aspect-video bg-secondary">
                  <img src={m.src} alt={a.name} className="h-full w-full object-cover" />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-base">{a.name}</h3>
                    <CheckCircle2 className="h-4 w-4 text-[oklch(0.7_0.15_145)]" />
                  </div>
                  <div className="mt-1 text-[10px] text-muted-foreground">
                    {format(new Date(m.uploadedAt), "PPp")}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">"{m.caption}"</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Select a highlighted day to view that night's report.
        </p>
      )}
    </div>
  );
}
