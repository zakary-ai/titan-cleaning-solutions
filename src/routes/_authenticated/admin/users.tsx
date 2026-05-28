import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listUsers, deleteUser } from "@/lib/users.functions";
import { inviteUser } from "@/lib/invite.functions";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: UsersPage,
});

function UsersPage() {
  const list = useServerFn(listUsers);
  const invite = useServerFn(inviteUser);
  const remove = useServerFn(deleteUser);
  const { user: me } = useAuth();
  const qc = useQueryClient();
  const { data: users = [] } = useQuery({ queryKey: ["users-all"], queryFn: () => list() });
  const removeM = useMutation({
    mutationFn: (user_id: string) => remove({ data: { user_id } }),
    onSuccess: () => { toast.success("User deleted"); qc.invalidateQueries({ queryKey: ["users-all"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: "", full_name: "", role: "supervisor" as const, organization_name: "" });
  const m = useMutation({
    mutationFn: () => invite({ data: { ...form } as any }),
    onSuccess: () => { toast.success("Welcome email sent"); setOpen(false); setForm({ email: "", full_name: "", role: "supervisor", organization_name: "" }); qc.invalidateQueries({ queryKey: ["users-all"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl md:text-3xl">Users</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="md:size-default">
              <Plus className="h-4 w-4 md:mr-2" />
              <span className="hidden sm:inline">Invite user</span>
              <span className="sm:hidden ml-1">Invite</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Invite user</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); m.mutate(); }} className="space-y-3">
              <div><Label>Full name</Label><Input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
              <div><Label>Email</Label><Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <p className="text-xs text-muted-foreground">A welcome email will be sent with the App Store link and a temporary password (<span className="font-mono text-foreground">Titan!2026</span>). They'll be prompted to set their own password on first sign-in.</p>
              <div>
                <Label>Role</Label>
                <Select value={form.role} onValueChange={(v: any) => setForm({ ...form, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Organization (clients)</Label><Input value={form.organization_name} onChange={(e) => setForm({ ...form, organization_name: e.target.value })} placeholder="Hotel name" /></div>
              <Button type="submit" disabled={m.isPending} className="w-full">{m.isPending ? "Creating…" : "Create user"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Mobile: card list */}
      <div className="mt-6 space-y-3 md:hidden">
        {users.map((u: any) => (
          <div key={u.id} className="rounded-xl bg-card gold-border p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">{u.full_name || "—"}</div>
                <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] uppercase tracking-wider text-gold">{u.role || "none"}</span>
                  {u.organization_name && (
                    <span className="text-xs text-muted-foreground truncate">{u.organization_name}</span>
                  )}
                </div>
              </div>
              {u.id !== me?.id && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="ghost" disabled={removeM.isPending}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete {u.full_name || u.email}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This permanently removes the account, role, and all property assignments. This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => removeM.mutate(u.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        ))}
        {users.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No users yet.
          </div>
        )}
      </div>

      {/* Desktop: table */}
      <div className="mt-6 hidden overflow-hidden rounded-xl bg-card gold-border md:block">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Org</th><th className="px-4 py-3" />
          </tr></thead>
          <tbody>
            {users.map((u: any) => (
              <tr key={u.id} className="border-t border-border">
                <td className="px-4 py-3">{u.full_name || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                <td className="px-4 py-3"><span className="rounded-md bg-secondary px-2 py-0.5 text-xs uppercase tracking-wider text-gold">{u.role || "none"}</span></td>
                <td className="px-4 py-3 text-muted-foreground">{u.organization_name || "—"}</td>
                <td className="px-4 py-3 text-right">
                  {u.id !== me?.id && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" disabled={removeM.isPending}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete {u.full_name || u.email}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This permanently removes the account, role, and all property assignments. This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => removeM.mutate(u.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
