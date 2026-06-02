import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPropertyReport, signMediaUrl, deleteUpload } from "@/lib/uploads.functions";
import { createIssue } from "@/lib/issues.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MessagesSquare, MessageSquarePlus, CheckCircle2, AlertCircle, Search, X } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { DeleteMenu } from "@/components/delete-menu";

export function ClientReport({ property_id, service_date }: { property_id: string; service_date?: string }) {
  const getReport = useServerFn(getPropertyReport);
  const { data, isLoading } = useQuery({
    queryKey: ["client-report", property_id, service_date ?? "latest"],
    queryFn: () => getReport({ data: { property_id, service_date } }),
  });

  // Hooks MUST be called before any conditional return.
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading report…</p>;

  const areas = data?.areas ?? [];
  const uploads = data?.uploads ?? [];

  const q = query.trim().toLowerCase();
  const filteredAreas = q
    ? areas.filter((a: any) => a.area_name?.toLowerCase().includes(q))
    : areas;

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        {data?.service_date ? (
          <p className="text-xs uppercase tracking-[0.18em] text-gold">
            Report for {format(new Date(data.service_date + "T00:00:00"), "EEEE, MMMM d, yyyy")}
          </p>
        ) : <span />}
        <Button
          size="icon"
          variant="ghost"
          aria-label="Search areas"
          onClick={() => {
            setSearchOpen((v) => {
              if (v) setQuery("");
              return !v;
            });
          }}
        >
          {searchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
        </Button>
      </div>
      {searchOpen && (
        <div className="mt-3">
          <Input
            autoFocus
            placeholder="Search areas…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      )}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filteredAreas.map((area: any) => {
          const upload = uploads.find((u: any) => u.area_id === area.id);
          return (
            <AreaCard key={area.id} area={area} upload={upload}
              property_id={property_id} service_date={data?.service_date ?? ""} />
          );
        })}
        {areas.length === 0 && (
          <p className="col-span-full text-sm text-muted-foreground">No areas configured yet.</p>
        )}
        {areas.length > 0 && filteredAreas.length === 0 && (
          <p className="col-span-full text-sm text-muted-foreground">No areas match "{query}".</p>
        )}
      </div>
    </div>
  );
}

function AreaCard({ area, upload, property_id }: any) {
  const sign = useServerFn(signMediaUrl);
  const create = useServerFn(createIssue);
  const delUpload = useServerFn(deleteUpload);
  const { role } = useAuth();
  const qc = useQueryClient();

  // Sign the media URL via React Query so the URL stays stable across refetches
  // (avoids the pause/restart loop caused by re-running an effect every refetch).
  const filePath: string | undefined = upload?.file_url;
  const { data: signed } = useQuery({
    queryKey: ["sign-media", filePath],
    queryFn: () => sign({ data: { path: filePath! } }),
    enabled: !!filePath,
    staleTime: 50 * 60_000,
    gcTime: 60 * 60_000,
  });
  const url = signed?.url ?? null;

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", initial_comment: "" });
  const [submitted, setSubmitted] = useState(false);

  const m = useMutation({
    mutationFn: () => create({ data: {
      property_id, area_id: area.id, upload_id: upload?.id ?? null,
      title: form.title, initial_comment: form.initial_comment,
    } }),
    onSuccess: () => {
      toast.success("Comment sent");
      setOpen(false);
      setForm({ title: "", initial_comment: "" });
      setSubmitted(true);
      qc.invalidateQueries({ queryKey: ["issues"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: () => delUpload({ data: { id: upload!.id } }),
    onSuccess: () => {
      toast.success("Upload deleted");
      qc.invalidateQueries({ queryKey: ["client-report"] });
      qc.invalidateQueries({ queryKey: ["service-dates"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="overflow-hidden rounded-xl bg-card gold-border">
      <div className="aspect-video bg-secondary">
        {url && upload?.file_type === "video" && (
          <video
            src={url}
            controls
            playsInline
            {...({ "webkit-playsinline": "true" } as any)}
            preload="metadata"
            className="h-full w-full object-cover bg-black"
          />
        )}
        {url && upload?.file_type === "image" && <img src={url} alt={area.area_name} className="h-full w-full object-cover" />}
        {!url && (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            {upload?.status === "missing" ? <span className="flex items-center gap-1 text-destructive"><AlertCircle className="h-4 w-4" /> Missing</span> : "Awaiting upload"}
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-base truncate">{area.area_name}</h3>
          <div className="flex items-center gap-1">
            {upload?.status === "uploaded" && <CheckCircle2 className="h-4 w-4 text-[oklch(0.7_0.15_145)]" />}
            {role === "admin" && upload?.id && (
              <DeleteMenu
                title={`Delete ${area.area_name} upload?`}
                description="This permanently removes this upload (photo/video and notes). This cannot be undone."
                pending={delMut.isPending}
                onConfirm={() => delMut.mutate()}
              />
            )}
          </div>
        </div>
        {upload?.uploaded_at && (
          <div className="mt-1 text-[10px] text-muted-foreground">{format(new Date(upload.uploaded_at), "PPp")}</div>
        )}
        {upload?.notes && <p className="mt-2 text-xs text-muted-foreground">"{upload.notes}"</p>}
        {submitted ? (
          <Button asChild size="sm" variant="outline" className="mt-3 w-full">
            <Link to="/client/issues">
              <MessagesSquare className="mr-2 h-4 w-4" /> View your thread
            </Link>
          </Button>
        ) : (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="mt-3 w-full">
                <MessageSquarePlus className="mr-2 h-4 w-4" /> Leave a comment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Comment on {area.area_name}</DialogTitle></DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); m.mutate(); }} className="space-y-3">
                <div><Label>Subject</Label><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Floor still looks dirty" /></div>
                <div><Label>Comment</Label><Textarea required rows={4} value={form.initial_comment} onChange={(e) => setForm({ ...form, initial_comment: e.target.value })} /></div>
                <Button type="submit" disabled={m.isPending} className="w-full">{m.isPending ? "Sending…" : "Send"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}

export function ClientPropertyHeader({ property_id }: { property_id: string }) {
  const getReport = useServerFn(getPropertyReport);
  const { data } = useQuery({
    queryKey: ["client-property-header", property_id],
    queryFn: () => getReport({ data: { property_id } }),
  });
  if (!data?.property) return null;
  return (
    <div>
      <h1 className="font-display text-2xl md:text-3xl">{data.property.name}</h1>
      {data.property.address && <p className="text-sm text-muted-foreground">{data.property.address}</p>}
    </div>
  );
}
