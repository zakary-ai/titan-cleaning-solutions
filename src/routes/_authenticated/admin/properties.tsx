import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listProperties, createProperty } from "@/lib/properties.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, MapPin } from "lucide-react";
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
  const [form, setForm] = useState({ name: "", address: "", client_organization: "" });
  const m = useMutation({
    mutationFn: () => create({ data: form }),
    onSuccess: () => { toast.success("Property created"); setOpen(false); setForm({ name: "", address: "", client_organization: "" }); qc.invalidateQueries({ queryKey: ["properties"] }); },
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
              <div><Label>Name</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              <div><Label>Client organization</Label><Input value={form.client_organization} onChange={(e) => setForm({ ...form, client_organization: e.target.value })} /></div>
              <Button type="submit" disabled={m.isPending} className="w-full">{m.isPending ? "Creating…" : "Create"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {properties.map((p: any) => (
          <Link key={p.id} to="/admin/properties/$id" params={{ id: p.id }}
            className="rounded-xl bg-card p-5 gold-border transition hover:gold-glow">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg">{p.name}</h3>
              {!p.active && <span className="text-xs text-muted-foreground">inactive</span>}
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" /> {p.address || "—"}
            </div>
            <div className="mt-3 text-xs text-gold">{p.client_organization || "Unassigned"}</div>
          </Link>
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
