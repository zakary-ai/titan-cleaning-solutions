import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { homeForRole } from "@/lib/role-routes";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { refresh } = useAuth();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setSubmitting(false);
      toast.error(error.message);
      return;
    }

    const userId = authData.user?.id;
    if (!userId) {
      setSubmitting(false);
      toast.error("Unable to verify this account. Please try again.");
      return;
    }

    await refresh();
    const { data: roleRow, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    setSubmitting(false);
    if (roleError) {
      toast.error("Signed in, but we couldn't load your account type.");
      return;
    }

    const accountRole = roleRow?.role as "admin" | "supervisor" | "client" | undefined;
    toast.success(accountRole ? `Signed in as ${accountRole}.` : "Signed in.");
    navigate({ to: homeForRole(accountRole ?? null) });
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <div className="mb-3 inline-flex items-center justify-center rounded-full border border-gold/40 bg-card px-4 py-1.5 text-xs uppercase tracking-[0.18em] text-gold">
            Titan Solutions
          </div>
          <h1 className="font-display text-3xl">Operations Portal</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to access your dashboard.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 rounded-2xl bg-card p-6 gold-glow">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" required value={email}
              onChange={(e) => setEmail(e.target.value)} placeholder="you@hotel.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="current-password" required
              value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" disabled={submitting} className="w-full bg-primary text-primary-foreground hover:bg-accent">
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
          <p className="pt-2 text-center text-xs text-muted-foreground">
            New users receive accounts by invitation from your administrator.
          </p>
        </form>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          <a href="/privacy" className="underline underline-offset-4 hover:text-gold">Privacy Policy</a>
          <span className="mx-2 text-border">·</span>
          <a href="/support" className="underline underline-offset-4 hover:text-gold">Support</a>
          <span className="mx-2 text-border">·</span>
          <a href="/demo" className="underline underline-offset-4 hover:text-gold">View Demo</a>
        </p>
      </div>
    </div>
  );
}
