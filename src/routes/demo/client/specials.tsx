import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { DemoPropertyHeader } from "@/components/demo/demo-shell";
import { DEMO_SPECIALS, DEMO_SPECIAL_DATES } from "@/lib/demo-data";

export const Route = createFileRoute("/demo/client/specials")({
  component: DemoSpecials,
});

function DemoSpecials() {
  const dateSet = useMemo(() => new Set(DEMO_SPECIAL_DATES), []);
  const days = useMemo(
    () => DEMO_SPECIAL_DATES.map((d) => new Date(d + "T00:00:00")),
    [],
  );
  const [selected, setSelected] = useState<Date | undefined>();
  const selectedStr = selected ? format(selected, "yyyy-MM-dd") : undefined;
  const items = selectedStr ? DEMO_SPECIALS[selectedStr] : undefined;

  return (
    <div className="space-y-6">
      <DemoPropertyHeader />

      <div className="rounded-2xl bg-card p-4 gold-border">
        <h2 className="font-display text-lg">Special Projects</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Days with special projects are highlighted in gold.
        </p>
        <div className="mt-3 flex justify-center">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={setSelected}
            modifiers={{ has: days }}
            modifiersClassNames={{ has: "bg-gold/15 text-gold font-semibold rounded-md" }}
            disabled={(date) => !dateSet.has(format(date, "yyyy-MM-dd"))}
            className={cn("p-3 pointer-events-auto")}
          />
        </div>
      </div>

      {items ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((sp) => (
            <div key={sp.id} className="overflow-hidden rounded-xl bg-card gold-border">
              <div className="aspect-video bg-secondary">
                {sp.type === "video" ? (
                  <video src={sp.src} controls playsInline className="h-full w-full object-cover" />
                ) : (
                  <img src={sp.src} alt={sp.caption} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="p-4">
                <h3 className="font-display text-base">{sp.caption}</h3>
                <div className="mt-1 text-[10px] text-muted-foreground">
                  {format(new Date(sp.createdAt), "PPp")}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Select a highlighted day to view the special projects from that day.
        </p>
      )}
    </div>
  );
}
