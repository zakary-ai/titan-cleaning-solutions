import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/unsubscribe")({
  component: UnsubscribePage,
  validateSearch: (s: Record<string, unknown>) => ({ token: typeof s.token === "string" ? s.token : "" }),
});

function UnsubscribePage() {
  const { token } = Route.useSearch();
  const [status, setStatus] = useState<"loading" | "valid" | "used" | "invalid" | "done" | "error">("loading");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) { setStatus("invalid"); return; }
    fetch(`/email/unsubscribe?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        if (!r.ok) { setStatus("invalid"); return; }
        const data = await r.json().catch(() => ({}));
        if (data?.alreadyUsed || data?.already_used) setStatus("used");
        else setStatus("valid");
      })
      .catch(() => setStatus("invalid"));
  }, [token]);

  const confirm = async () => {
    setSubmitting(true);
    try {
      const r = await fetch("/email/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!r.ok) { setStatus("error"); return; }
      setStatus("done");
    } catch { setStatus("error"); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm text-center">
        <div className="mb-3 inline-flex items-center justify-center rounded-full border border-gold/40 bg-card px-4 py-1.5 text-xs uppercase tracking-[0.18em] text-gold">
          Titan Solutions
        </div>
        <h1 className="font-display text-3xl mb-4">Unsubscribe</h1>

        {status === "loading" && <p className="text-muted-foreground">Verifying your request…</p>}
        {status === "valid" && (
          <div className="rounded-2xl bg-card p-6 gold-glow space-y-4">
            <p className="text-sm text-muted-foreground">Click below to stop receiving emails from Titan Solutions.</p>
            <Button onClick={confirm} disabled={submitting} className="w-full">
              {submitting ? "Unsubscribing…" : "Confirm unsubscribe"}
            </Button>
          </div>
        )}
        {status === "used" && <p className="text-muted-foreground">You're already unsubscribed.</p>}
        {status === "done" && <p className="text-muted-foreground">You've been unsubscribed. You won't receive further emails.</p>}
        {status === "invalid" && <p className="text-destructive">This unsubscribe link is invalid or expired.</p>}
        {status === "error" && <p className="text-destructive">Something went wrong. Please try again later.</p>}
      </div>
    </div>
  );
}
