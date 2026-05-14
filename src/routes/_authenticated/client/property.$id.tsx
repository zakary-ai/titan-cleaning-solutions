import { createFileRoute, Link } from "@tanstack/react-router";
import { MessagesSquare } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPropertyReport, listServiceDates, signMediaUrl } from "@/lib/uploads.functions";
import { createIssue } from "@/lib/issues.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, MessageSquarePlus, CheckCircle2, AlertCircle, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/client/property/$id")({
  component: ClientPropertyView,
});

function ClientPropertyView() {
  const { id } = Route.useParams();
  const getReport = useServerFn(getPropertyReport);
  const getDates = useServerFn(listServiceDates);
  const [date, setDate] = useState<string | undefined>();

  const { data: dates = [] } = useQuery({ queryKey: ["service-dates", id], queryFn: () => getDates({ data: { property_id: id } }) });
  const { data } = useQuery({
    queryKey: ["client-report", id, date], queryFn: () => getReport({ data: { property_id: id, service_date: date } }),
  });

  useEffect(() => { if (!date && dates[0]) setDate(dates[0]); }, [dates, date]);

  return (
    <div>
      <Link to="/client" className="inline-flex items-center text-sm text-muted-foreground hover:text-gold">
        <ArrowLeft className="mr-1 h-3 w-3" /> Properties
      </Link>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">{data?.property?.name}</h1>
          <p className="text-sm text-muted-foreground">{data?.property?.address}</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gold" />
          <Select value={date} onValueChange={setDate}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Select date" /></SelectTrigger>
            <SelectContent>
              {dates.map((d: string) => <SelectItem key={d} value={d}>{format(new Date(d), "EEE, MMM d")}</SelectItem>)}
              {dates.length === 0 && <SelectItem value="none" disabled>No reports yet</SelectItem>}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {(data?.areas ?? []).map((area: any) => {
          const upload = (data?.uploads ?? []).find((u: any) => u.area_id === area.id);
          return <AreaCard key={area.id} area={area} upload={upload} property_id={id} service_date={data?.service_date ?? ""} />;
        })}
        {(data?.areas ?? []).length === 0 && (
          <p className="col-span-full text-sm text-muted-foreground">No areas configured yet.</p>
        )}
      </div>
    </div>
  );
}

function AreaCard({ area, upload, property_id, service_date }: any) {
  const sign = useServerFn(signMediaUrl);
  const create = useServerFn(createIssue);
  const qc = useQueryClient();
  const [url, setUrl] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", initial_comment: "" });

  useEffect(() => {
    if (upload?.file_url) sign({ data: { path: upload.file_url } }).then(({ url }) => setUrl(url));
    else setUrl(null);
  }, [upload?.file_url]);

  const m = useMutation({
    mutationFn: () => create({ data: {
      property_id, area_id: area.id, upload_id: upload?.id ?? null,
      title: form.title, initial_comment: form.initial_comment,
    } }),
    onSuccess: () => { toast.success("Comment sent"); setOpen(false); setForm({ title: "", initial_comment: "" }); qc.invalidateQueries({ queryKey: ["issues"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="overflow-hidden rounded-xl bg-card gold-border">
      <div className="aspect-video bg-secondary">
        {url && upload?.file_type === "video" && <video src={url} controls playsInline className="h-full w-full object-cover" />}
        {url && upload?.file_type === "image" && <img src={url} alt={area.area_name} className="h-full w-full object-cover" />}
        {!url && (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            {upload?.status === "missing" ? <span className="flex items-center gap-1 text-destructive"><AlertCircle className="h-4 w-4" /> Missing</span> : "Awaiting upload"}
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base">{area.area_name}</h3>
          {upload?.status === "uploaded" && <CheckCircle2 className="h-4 w-4 text-[oklch(0.7_0.15_145)]" />}
        </div>
        {upload?.uploaded_at && (
          <div className="mt-1 text-[10px] text-muted-foreground">{format(new Date(upload.uploaded_at), "PPp")}</div>
        )}
        {upload?.notes && <p className="mt-2 text-xs text-muted-foreground">"{upload.notes}"</p>}
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
      </div>
    </div>
  );
}
