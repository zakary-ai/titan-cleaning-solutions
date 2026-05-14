import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProperty, upsertArea, deleteArea, assignUser, unassignUser } from "@/lib/properties.functions";
import { searchUsersByRole } from "@/lib/users.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/properties/$id")({
  component: PropertyDetail,
});

function PropertyDetail() {
  const { id } = Route.useParams();
  const get = useServerFn(getProperty);
  const upsert = useServerFn(upsertArea);
  const remove = useServerFn(deleteArea);
  const assign = useServerFn(assignUser);
  const unassign = useServerFn(unassignUser);
  const findUsers = useServerFn(searchUsersByRole);
  const qc = useQueryClient();

  const { data } = useQuery({ queryKey: ["property", id], queryFn: () => get({ data: { id } }) });
  const { data: supervisors = [] } = useQuery({ queryKey: ["users", "supervisor"], queryFn: () => findUsers({ data: { role: "supervisor" } }) });
  const { data: clients = [] } = useQuery({ queryKey: ["users", "client"], queryFn: () => findUsers({ data: { role: "client" } }) });

  const [newArea, setNewArea] = useState("");
  const [assignRole, setAssignRole] = useState<"supervisor" | "client">("supervisor");
  const [assignUserId, setAssignUserId] = useState("");

  const refetch = () => qc.invalidateQueries({ queryKey: ["property", id] });

  const addArea = useMutation({
    mutationFn: () => upsert({ data: { property_id: id, area_name: newArea, required_upload: true, display_order: (data?.areas.length ?? 0) + 1, active: true } }),
    onSuccess: () => { setNewArea(""); refetch(); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div>
      <Link to="/admin/properties" className="inline-flex items-center text-sm text-muted-foreground hover:text-gold">
        <ArrowLeft className="mr-1 h-3 w-3" /> All properties
      </Link>
      <h1 className="mt-2 font-display text-3xl">{data?.property?.name ?? "Property"}</h1>
      <p className="text-sm text-muted-foreground">{data?.property?.address}</p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section className="rounded-xl bg-card p-5 gold-border">
          <h2 className="font-display text-lg">Areas</h2>
          <p className="mt-1 text-xs text-muted-foreground">Areas supervisors must upload proof for each night.</p>
          <div className="mt-4 space-y-2">
            {(data?.areas ?? []).map((a: any) => (
              <div key={a.id} className="flex items-center justify-between rounded-md bg-secondary px-3 py-2">
                <div>
                  <div className="text-sm">{a.area_name}</div>
                  <div className="text-[10px] text-muted-foreground">{a.required_upload ? "Required" : "Optional"}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={a.required_upload} onCheckedChange={(v) => upsert({ data: { id: a.id, property_id: id, area_name: a.area_name, required_upload: v, display_order: a.display_order, active: a.active } }).then(refetch)} />
                  <Button size="icon" variant="ghost" onClick={() => remove({ data: { id: a.id } }).then(refetch)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); if (newArea.trim()) addArea.mutate(); }} className="mt-3 flex gap-2">
            <Input placeholder="e.g. Lobby, Pool deck" value={newArea} onChange={(e) => setNewArea(e.target.value)} />
            <Button type="submit"><Plus className="h-4 w-4" /></Button>
          </form>
        </section>

        <section className="rounded-xl bg-card p-5 gold-border">
          <h2 className="font-display text-lg">Assignments</h2>
          <div className="mt-4 space-y-2">
            {(data?.assignments ?? []).map((a: any) => {
              const user = [...supervisors, ...clients].find((u: any) => u.id === a.user_id);
              return (
                <div key={a.id} className="flex items-center justify-between rounded-md bg-secondary px-3 py-2">
                  <div>
                    <div className="text-sm">{user?.full_name || user?.email || a.user_id.slice(0, 8)}</div>
                    <div className="text-[10px] uppercase tracking-wider text-gold">{a.role_on_property}</div>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => unassign({ data: { id: a.id } }).then(refetch)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
          <div className="mt-3 space-y-2">
            <div className="flex gap-2">
              <Select value={assignRole} onValueChange={(v: any) => { setAssignRole(v); setAssignUserId(""); }}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                </SelectContent>
              </Select>
              <Select value={assignUserId} onValueChange={setAssignUserId}>
                <SelectTrigger className="flex-1"><SelectValue placeholder="Select user…" /></SelectTrigger>
                <SelectContent>
                  {(assignRole === "supervisor" ? supervisors : clients).map((u: any) => (
                    <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" disabled={!assignUserId} onClick={() => {
              assign({ data: { property_id: id, user_id: assignUserId, role_on_property: assignRole } })
                .then(() => { setAssignUserId(""); refetch(); })
                .catch((e: any) => toast.error(e.message));
            }}>Assign</Button>
          </div>
        </section>
      </div>
    </div>
  );
}
