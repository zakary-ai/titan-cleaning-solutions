import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getNightlyChecklist, recordUpload, submitNightlyReport, signMediaUrl, updateUploadNotes } from "@/lib/uploads.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Camera, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/supervisor/property/$id")({
  component: NightlyChecklist,
});

function NightlyChecklist() {
  const { id } = Route.useParams();
  const today = new Date().toISOString().slice(0, 10);
  const get = useServerFn(getNightlyChecklist);
  const record = useServerFn(recordUpload);
  const submit = useServerFn(submitNightlyReport);
  const updateNotes = useServerFn(updateUploadNotes);
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["checklist", id, today],
    queryFn: () => get({ data: { property_id: id, service_date: today } }),
  });

  const submitReport = useMutation({
    mutationFn: () => submit({ data: { property_id: id, service_date: today } }),
    onSuccess: () => { toast.success("Nightly report submitted"); qc.invalidateQueries({ queryKey: ["checklist", id, today] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div>
      <Link to="/supervisor" className="inline-flex items-center text-sm text-muted-foreground hover:text-gold">
        <ArrowLeft className="mr-1 h-3 w-3" /> Properties
      </Link>
      <div className="mt-2 flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl">{data?.property?.name}</h1>
          <p className="text-sm text-muted-foreground">Service date: {today}</p>
        </div>
        <Button onClick={() => submitReport.mutate()} disabled={submitReport.isPending}>
          {submitReport.isPending ? "Submitting…" : "Submit nightly report"}
        </Button>
      </div>

      <div className="mt-6 space-y-3">
        {(data?.areas ?? []).map((area: any) => {
          const upload = (data?.uploads ?? []).find((u: any) => u.area_id === area.id);
          return (
            <AreaCard key={area.id} area={area} upload={upload} property_id={id} service_date={today}
              record={record} updateNotes={updateNotes}
              onChange={() => qc.invalidateQueries({ queryKey: ["checklist", id, today] })} />
          );
        })}
      </div>
    </div>
  );
}

function AreaCard({ area, upload, property_id, service_date, record, updateNotes, onChange }: any) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [notes, setNotes] = useState(upload?.notes ?? "");
  const sign = useServerFn(signMediaUrl);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "bin";
      const path = `${property_id}/${service_date}/${area.id}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("cleaning-media").upload(path, file, { upsert: true });
      if (error) throw error;
      const file_type = file.type.startsWith("video") ? "video" : "image";
      await record({ data: { property_id, area_id: area.id, service_date, file_url: path, file_type, notes } });
      toast.success(`${area.area_name} uploaded`);
      onChange();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  const showPreview = async () => {
    if (!upload?.file_url) return;
    const { url } = await sign({ data: { path: upload.file_url } });
    setPreviewUrl(url);
  };

  const status = upload?.status ?? "pending";
  return (
    <div className="rounded-xl bg-card p-4 gold-border">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-lg truncate">{area.area_name}</h3>
            {status === "uploaded" && <CheckCircle2 className="h-4 w-4 text-[oklch(0.7_0.15_145)]" />}
            {status === "missing" && <AlertCircle className="h-4 w-4 text-destructive" />}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {area.required_upload ? "Required" : "Optional"} · {status}
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*,video/*" capture="environment" className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        <Button size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Camera className="mr-2 h-4 w-4" /> {upload?.file_url ? "Replace" : "Upload"}</>}
        </Button>
      </div>

      {upload?.file_url && (
        <button onClick={showPreview} className="mt-3 text-xs text-gold underline-offset-2 hover:underline">
          View {upload.file_type}
        </button>
      )}
      {previewUrl && (
        upload?.file_type === "video"
          ? <video src={previewUrl} controls playsInline className="mt-2 max-h-64 w-full rounded-md bg-black" />
          : <img src={previewUrl} alt="" className="mt-2 max-h-64 w-full rounded-md object-cover" />
      )}

      <Textarea className="mt-3" rows={2} placeholder="Notes (optional)…" value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={() => upload?.id && notes !== (upload.notes ?? "") && updateNotes({ data: { id: upload.id, notes } }).then(onChange)} />
    </div>
  );
}
