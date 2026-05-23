import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/demo/")({
  component: DemoLogin,
});

function DemoLogin() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl bg-card p-8 gold-border">
        <div className="flex flex-col items-center text-center">
          <img src="/icon-512.png" alt="Titan Solutions" className="h-16 w-16 object-contain" />
          <h1 className="mt-4 font-display text-2xl">Titan Solutions</h1>
          <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-gold">Interactive demo</p>
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Step inside the client portal and explore what your nightly reports, history, special
          projects, and comments would look like.
        </p>
        <Button asChild className="mt-6 w-full">
          <Link to="/demo/client">
            Login as Client view <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          This is a read-only demo. No data is sent or saved.
        </p>
      </div>
    </div>
  );
}
