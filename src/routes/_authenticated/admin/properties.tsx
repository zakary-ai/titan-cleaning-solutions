import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listProperties, createProperty, assignUser } from "@/lib/properties.functions";
import { inviteClientToProperty, listAssignableUsers } from "@/lib/invite.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, MapPin, UserPlus, Users, Shield, ShieldPlus } from "lucide-react";
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
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Properties</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> New property</Button></DialogTrigger>
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
  const invite = useServerFn(inviteClientToProperty);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: "", full_name: "" });

  const m = useMutation({
    mutationFn: () => invite({ data: { property_id: p.id, email: form.email, full_name: form.full_name } }),
    onSuccess: () => {
      toast.success("Invitation sent");
      setOpen(false);
      setForm({ email: "", full_name: "" });
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
        <div className="mt-3 text-xs text-gold">{p.client_organization || "Unassigned"}</div>
      </Link>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" className="mt-4 w-full">
            <UserPlus className="mr-2 h-4 w-4" /> Add users
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite client to {p.name}</DialogTitle>
          </DialogHeader>
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
              We'll email them an invitation to set up their account and access {p.name}.
            </p>
            <Button type="submit" disabled={m.isPending} className="w-full">
              {m.isPending ? "Sending…" : "Send invitation"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
