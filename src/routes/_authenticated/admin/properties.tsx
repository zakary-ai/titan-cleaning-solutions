import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listProperties, createProperty, updateProperty, assignUser, unassignUserFromProperty } from "@/lib/properties.functions";
import { inviteClientToProperty, listAssignableUsers } from "@/lib/invite.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, MapPin, UserPlus, Users, Shield, ShieldPlus, Clock, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/properties")({
  component: PropertiesPage,
});

function PropertiesPage() {
  const list = useServerFn(listProperties);
  const create = useServerFn(createProperty);
  const qc = useQueryClient();
  const { data: properties = [] } = useQuery({ queryKey: ["properties"], queryFn: () => list() });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", areas: "" });

  const m = useMutation({
    mutationFn: () => {
      const areas = form.areas
        .split("\n")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      return create({
        data: {
          name: form.name,
          address: form.address || null,
          areas,
        },
      });
    },
    onSuccess: () => {
      toast.success("Property created");
      setOpen(false);
      setForm({ name: "", address: "", areas: "" });
      qc.invalidateQueries({ queryKey: ["properties"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl md:text-3xl">Properties</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="md:size-default">
              <Plus className="h-4 w-4 md:mr-2" />
              <span className="hidden sm:inline">New property</span>
              <span className="sm:hidden ml-1">New</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create property</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); m.mutate(); }} className="space-y-3">
              <div>
                <Label>Property name</Label>
                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label>Property address</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div>
                <Label>Service areas</Label>
                <Textarea
                  rows={6}
                  placeholder={"Lobby\nPool deck\nFitness center\nRestrooms"}
                  value={form.areas}
                  onChange={(e) => setForm({ ...form, areas: e.target.value })}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  One per line. Supervisors will need to upload proof for each of these.
                </p>
              </div>
              <Button type="submit" disabled={m.isPending} className="w-full">
                {m.isPending ? "Creating…" : "Create"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {properties.map((p: any) => (
          <PropertyCard key={p.id} property={p} />
        ))}
        {properties.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No properties yet. Create your first one.
          </div>
        )}
      </div>
    </div>
  );
}

function PropertyCard({ property: p }: { property: any }) {
  const update = useServerFn(updateProperty);
  const qc = useQueryClient();
  const initial = (p.daily_report_time ?? "08:00:00").slice(0, 5);
  const [time, setTime] = useState(initial);
  const tz = p.daily_report_timezone ?? "America/New_York";
  const save = useMutation({
    mutationFn: (value: string) =>
      update({ data: { id: p.id, daily_report_time: `${value}:00` } }),
    onSuccess: () => {
      toast.success("Daily report time updated");
      qc.invalidateQueries({ queryKey: ["properties"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="rounded-xl bg-card p-5 gold-border transition hover:gold-glow">
      <Link to="/admin/properties/$id" params={{ id: p.id }} className="block">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg">{p.name}</h3>
          {!p.active && <span className="text-xs text-muted-foreground">inactive</span>}
        </div>
        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" /> {p.address || "—"}
        </div>
      </Link>

      <div className="mt-4 rounded-lg border border-border p-3">
        <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" /> Daily report send time
        </Label>
        <div className="mt-2 flex items-center gap-2">
          <Input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="h-9 w-32"
          />
          <span className="text-xs text-muted-foreground">{tz === "America/New_York" ? "EST" : tz}</span>
          <Button
            size="sm"
            variant="outline"
            className="ml-auto"
            disabled={save.isPending || `${time}:00` === (p.daily_report_time ?? "08:00:00")}
            onClick={() => save.mutate(time)}
          >
            {save.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          By default, a day's uploads appear in the client account the next day at this time.
        </p>
      </div>

      <InstantReleaseToggle property={p} />

      <div className="mt-4 grid grid-cols-2 gap-2">
        <InviteDialog propertyId={p.id} propertyName={p.name} role="client"
          trigger={<Button size="sm" variant="outline"><UserPlus className="mr-2 h-3.5 w-3.5" /> Add user</Button>} />
        <AssignDialog propertyId={p.id} propertyName={p.name} role="client"
          trigger={<Button size="sm" variant="outline"><Users className="mr-2 h-3.5 w-3.5" /> Assign user</Button>} />
        <InviteDialog propertyId={p.id} propertyName={p.name} role="supervisor"
          trigger={<Button size="sm" variant="outline"><ShieldPlus className="mr-2 h-3.5 w-3.5" /> Add supervisor</Button>} />
        <AssignDialog propertyId={p.id} propertyName={p.name} role="supervisor"
          trigger={<Button size="sm" variant="outline"><Shield className="mr-2 h-3.5 w-3.5" /> Assign supervisor</Button>} />
      </div>
    </div>
  );
}

function InstantReleaseToggle({ property: p }: { property: any }) {
  const update = useServerFn(updateProperty);
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: (value: boolean) => update({ data: { id: p.id, instant_client_release: value } }),
    onSuccess: () => {
      toast.success("Release setting updated");
      qc.invalidateQueries({ queryKey: ["properties"] });
    },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <div className="mt-3 flex items-start justify-between gap-3 rounded-lg border border-border p-3">
      <div className="min-w-0">
        <Label className="flex items-center gap-1.5 text-xs">
          <Zap className="h-3.5 w-3.5" /> Instant client release
        </Label>
        <p className="mt-1 text-[11px] text-muted-foreground">
          When on, uploads appear in the client account immediately. When off, they appear the next day at the send time above.
        </p>
      </div>
      <Switch
        checked={!!p.instant_client_release}
        disabled={m.isPending}
        onCheckedChange={(v) => m.mutate(v)}
      />
    </div>
  );
}

function InviteDialog({ propertyId, propertyName, role, trigger }: {
  propertyId: string; propertyName: string; role: "client" | "supervisor"; trigger: React.ReactNode;
}) {
  const invite = useServerFn(inviteClientToProperty);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: "", full_name: "" });
  const m = useMutation({
    mutationFn: () => invite({ data: { property_id: propertyId, email: form.email, full_name: form.full_name, role } }),
    onSuccess: () => {
      toast.success("Invitation sent");
      setOpen(false);
      setForm({ email: "", full_name: "" });
    },
    onError: (e: any) => toast.error(e.message),
  });
  const label = role === "client" ? "user" : "supervisor";
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add {label} to {propertyName}</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); m.mutate(); }} className="space-y-3">
          <div>
            <Label>Full name</Label>
            <Input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <p className="text-xs text-muted-foreground">
            We'll email them an invitation to set up their account and download the app.
          </p>
          <Button type="submit" disabled={m.isPending} className="w-full">
            {m.isPending ? "Sending…" : "Send invitation"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AssignDialog({ propertyId, propertyName, role, trigger }: {
  propertyId: string; propertyName: string; role: "client" | "supervisor"; trigger: React.ReactNode;
}) {
  const list = useServerFn(listAssignableUsers);
  const assign = useServerFn(assignUser);
  const unassign = useServerFn(unassignUserFromProperty);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: users = [], refetch } = useQuery({
    queryKey: ["assignable-users", role, propertyId],
    queryFn: () => list({ data: { role, property_id: propertyId } }),
    enabled: open,
  });
  const m = useMutation({
    mutationFn: (userId: string) => assign({ data: { property_id: propertyId, user_id: userId, role_on_property: role } }),
    onSuccess: () => {
      toast.success("Assigned");
      refetch();
      qc.invalidateQueries({ queryKey: ["properties"] });
    },
    onError: (e: any) => toast.error(e.message),
  });
  const u = useMutation({
    mutationFn: (userId: string) => unassign({ data: { user_id: userId, property_id: propertyId } }),
    onSuccess: () => {
      toast.success("Unassigned");
      refetch();
      qc.invalidateQueries({ queryKey: ["properties"] });
    },
    onError: (e: any) => toast.error(e.message),
  });
  const label = role === "client" ? "users" : "supervisors";
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Assign {label} to {propertyName}</DialogTitle></DialogHeader>
        <div className="max-h-96 space-y-2 overflow-y-auto">
          {users.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">No existing {label} yet.</p>
          )}
          {users.map((usr: any) => (
            <div key={usr.id} className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <div className="text-sm font-medium">{usr.full_name || usr.email}</div>
                <div className="text-xs text-muted-foreground">{usr.email}</div>
              </div>
              {usr.assigned ? (
                <Button size="sm" variant="outline" disabled={u.isPending} onClick={() => u.mutate(usr.id)}>
                  Unassign
                </Button>
              ) : (
                <Button size="sm" disabled={m.isPending} onClick={() => m.mutate(usr.id)}>
                  Assign
                </Button>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

