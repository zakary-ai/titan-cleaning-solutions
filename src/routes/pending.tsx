import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/pending")({
  component: PendingPage,
});

function PendingPage() {
  const { signOut, profile } = useAuth();
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md rounded-2xl bg-card p-8 text-center gold-glow">
        <div className="mb-3 text-xs uppercase tracking-[0.18em] text-gold">Account pending</div>
        <h1 className="font-display text-2xl">Awaiting role assignment</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Hi {profile?.full_name || profile?.email}, your account exists but hasn't been assigned a role yet.
          Please contact your Titan Solutions administrator.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button variant="outline" asChild><Link to="/login">Switch account</Link></Button>
          <Button onClick={signOut}>Sign out</Button>
        </div>
      </div>
    </div>
  );
}
