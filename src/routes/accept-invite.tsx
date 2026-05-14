import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/accept-invite")({
  component: AcceptInvitePage,
});

function AcceptInvitePage() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { refresh } = useAuth();

  useEffect(() => {
    // Supabase appends tokens in the URL hash — the client picks them up automatically.
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      setReady(!!data.session);
    };
    check();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setReady(!!s);
    });
    return () => subscription.unsubscribe();
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters.");
    if (password !== confirm) return toast.error("Passwords do not match.");
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setSubmitting(false);
      return toast.error(error.message);
    }
    await supabase.auth.signOut();
    await refresh();
    setSubmitting(false);
    toast.success("Password set. Please sign in.");
    navigate({ to: "/login" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <div className="mb-3 inline-flex items-center justify-center rounded-full border border-gold/40 bg-card px-4 py-1.5 text-xs uppercase tracking-[0.18em] text-gold">
            Titan Solutions
          </div>
          <h1 className="font-display text-3xl">Set your password</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {ready
              ? "Choose a password to finish creating your account."
              : "Validating your invitation link…"}
          </p>
        </div>

        {ready ? (
          <form onSubmit={onSubmit} className="space-y-4 rounded-2xl bg-card p-6 gold-glow">
            <div className="space-y-1.5">
              <Label htmlFor="password">New password</Label>
              <Input id="password" type="password" required minLength={8} value={password}
                onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 characters" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input id="confirm" type="password" required minLength={8} value={confirm}
                onChange={(e) => setConfirm(e.target.value)} />
            </div>
            <Button type="submit" disabled={submitting} className="w-full bg-primary text-primary-foreground hover:bg-accent">
              {submitting ? "Saving…" : "Create account"}
            </Button>
          </form>
        ) : (
          <div className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground gold-glow">
            If nothing happens, the link may have expired. Ask your administrator to resend the invite.
          </div>
        )}
      </div>
    </div>
  );
}
