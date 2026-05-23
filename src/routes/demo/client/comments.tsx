import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { DEMO_THREADS } from "@/lib/demo-data";

export const Route = createFileRoute("/demo/client/comments")({
  component: DemoComments,
});

function DemoComments() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const thread = DEMO_THREADS.find((t) => t.id === selectedId) ?? null;

  return (
    <div className="flex h-[calc(100vh-8rem)] min-w-0 flex-col overflow-x-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-2xl md:text-3xl">Comments</h1>
        <span className="text-[10px] uppercase tracking-[0.18em] text-gold">Read-only demo</span>
      </div>

      <div className="mt-4 grid min-h-0 flex-1 gap-4 md:grid-cols-[320px_1fr]">
        <div className={`min-h-0 overflow-y-auto pr-1 ${selectedId ? "hidden md:block" : ""}`}>
          <div className="space-y-2">
            {DEMO_THREADS.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                className={`w-full rounded-lg border p-3 text-left transition ${
                  selectedId === t.id
                    ? "border-gold bg-card"
                    : "border-border bg-card/50 hover:bg-card"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold truncate">{t.title}</span>
                  <span className="text-[10px] uppercase text-gold">{t.status}</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">Demo Hotel · {t.area}</div>
                <div className="text-[10px] text-muted-foreground">
                  {format(new Date(t.createdAt), "MMM d, p")}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className={`flex min-h-0 flex-col rounded-xl bg-card gold-border ${!selectedId ? "hidden md:flex" : ""}`}>
          {!thread ? (
            <div className="flex h-full items-center justify-center p-5">
              <p className="text-sm text-muted-foreground">Select a comment to view the thread.</p>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-2 border-b border-border/60 p-4">
                <button
                  onClick={() => setSelectedId(null)}
                  className="md:hidden mt-1 text-muted-foreground hover:text-gold"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="min-w-0">
                  <h2 className="font-display text-xl truncate">{thread.title}</h2>
                  <p className="text-xs text-muted-foreground">
                    Demo Hotel · {thread.area} · {format(new Date(thread.createdAt), "PPp")}
                  </p>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-3">
                {thread.messages.map((m) => (
                  <div key={m.id} className="rounded-md bg-secondary p-3">
                    <div className="text-xs text-gold">{m.sender}</div>
                    <div className="mt-1 whitespace-pre-wrap text-sm">{m.body}</div>
                    <div className="mt-1 text-[10px] text-muted-foreground">
                      {format(new Date(m.createdAt), "PPp")}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-border/60 p-3 text-center text-[11px] text-muted-foreground">
                Replies are disabled in this demo.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
