import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

const DISMISS_KEY = "setPasswordDismissedUntil";

export function SetPasswordPrompt() {
  const { user, session, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dismissedUntil, setDismissedUntil] = useState<number | null>(() => {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(DISMISS_KEY) : null;
    return raw ? parseInt(raw, 10) : null;
  });

  useEffect(() => {
    if (loading) return;
    if (!user || !session) { setOpen(false); return; }
    const passwordSet = user.user_metadata?.password_set === true;
    const isDismissed = dismissedUntil !== null && Date.now() < dismissedUntil;
    setOpen(!passwordSet && !isDismissed);
  }, [loading, user?.id, user?.user_metadata?.password_set, session?.access_token, dismissedUntil]);

  if (!user || !session) return null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 10) return toast.error("Password must be at least 10 characters.");
    if (password !== confirm) return toast.error("Passwords do not match.");
    setSubmitting(true);
    try {
      // Ensure we have a fresh, valid session before calling updateUser.
      // Magic-link sessions can be short-lived and cause "Auth session missing".
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        await supabase.auth.refreshSession();
      } else {
        // Proactively refresh to avoid expired access tokens.
        await supabase.auth.refreshSession({ refresh_token: sess.session.refresh_token });
      }
      const { data: fresh } = await supabase.auth.getUser();
      if (!fresh.user) {
        toast.error("Your session expired. Please sign in again.");
        await supabase.auth.signOut();
        setSubmitting(false);
        return;
      }
      const { error } = await supabase.auth.updateUser({
        password,
        data: { ...(fresh.user.user_metadata ?? {}), password_set: true },
      });
      if (error) {
        toast.error(error.message);
        setSubmitting(false);
        return;
      }
      toast.success("Password set. You can use it to sign in next time.");
      setOpen(false);
    } catch (err: any) {
      toast.error(err?.message ?? "Could not set password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => { /* required */ }}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Set your password</DialogTitle>
          <DialogDescription>
            Create a password so you can sign in at any time from the login page.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="new-password">New password</Label>
            <Input id="new-password" type="password" required minLength={10} value={password}
              onChange={(e) => setPassword(e.target.value)} placeholder="At least 10 characters" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">Confirm password</Label>
            <Input id="confirm-password" type="password" required minLength={10} value={confirm}
              onChange={(e) => setConfirm(e.target.value)} />
          </div>
          <ul className="text-xs text-muted-foreground space-y-1 rounded-md border p-3">
            <li className={password.length >= 10 ? "text-green-600" : ""}>• At least 10 characters</li>
            <li className={/[A-Z]/.test(password) ? "text-green-600" : ""}>• One uppercase letter</li>
            <li className={/[a-z]/.test(password) ? "text-green-600" : ""}>• One lowercase letter</li>
            <li className={/[0-9]/.test(password) ? "text-green-600" : ""}>• One number</li>
            <li className={/[^A-Za-z0-9]/.test(password) ? "text-green-600" : ""}>• One symbol (e.g. !@#$%)</li>
            <li>• Avoid common words & reused passwords (checked against known data breaches)</li>
          </ul>
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Saving…" : "Save password"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
