import { createFileRoute } from "@tanstack/react-router";
import { DemoPropertyHeader } from "@/components/demo/demo-shell";
import { DEMO_AREAS, DEMO_TODAY, type DemoMedia } from "@/lib/demo-data";
import { CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/demo/client/")({
  component: DemoToday,
});

function DemoToday() {
  return (
    <div className="space-y-6">
      <DemoPropertyHeader />
      <p className="text-xs uppercase tracking-[0.18em] text-gold">
        Report for {format(new Date(), "EEEE, MMMM d, yyyy")}
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {DEMO_AREAS.map((a) => (
          <AreaCard key={a.id} name={a.name} media={DEMO_TODAY[a.id]} />
        ))}
      </div>
    </div>
  );
}

function AreaCard({ name, media }: { name: string; media: DemoMedia }) {
  return (
    <div className="overflow-hidden rounded-xl bg-card gold-border">
      <div className="aspect-video bg-secondary">
        {media.type === "video" ? (
          <video src={media.src} controls playsInline className="h-full w-full object-cover" />
        ) : (
          <img src={media.src} alt={name} className="h-full w-full object-cover" />
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base">{name}</h3>
          <CheckCircle2 className="h-4 w-4 text-[oklch(0.7_0.15_145)]" />
        </div>
        <div className="mt-1 text-[10px] text-muted-foreground">
          {format(new Date(media.uploadedAt), "PPp")}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">"{media.caption}"</p>
      </div>
    </div>
  );
}
