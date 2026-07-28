import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getNightlyChecklist, recordUpload, submitNightlyReport, signMediaUrl, updateUploadNotes } from "@/lib/uploads.functions";
import { supabase } from "@/integrations/supabase/client";
import { getServiceDateForNow } from "@/lib/service-date";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { SpecialProjectsManager } from "@/components/special-projects-view";
import { ArrowLeft, Camera, CheckCircle2, AlertCircle, Loader2, CalendarIcon } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/supervisor/property/$id")({
  component: NightlyChecklist,
});

function parseYmd(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function formatYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function NightlyChecklist() {
  const { id } = Route.useParams();
  const get = useServerFn(getNightlyChecklist);
  const record = useServerFn(recordUpload);
  const submit = useServerFn(submitNightlyReport);
  const updateNotes = useServerFn(updateUploadNotes);
  const qc = useQueryClient();
  const navigate = useNavigate();

  // Night-shift rollover: uploads before noon (property TZ) count toward the previous day.
  const [serviceDate, setServiceDate] = useState<string>(() => getServiceDateForNow());
  const [userPicked, setUserPicked] = useState(false);

  const { data } = useQuery({
    queryKey: ["checklist", id, serviceDate],
    queryFn: () => get({ data: { property_id: id, service_date: serviceDate } }),
  });

  // Once the property's timezone loads, recompute default rollover date (unless user picked).
  useEffect(() => {
    const tz = data?.property?.daily_report_timezone;
    if (tz && !userPicked) {
      const computed = getServiceDateForNow(tz);
      if (computed !== serviceDate) setServiceDate(computed);
    }
  }, [data?.property?.daily_report_timezone, userPicked, serviceDate]);

  const submitReport = useMutation({
    mutationFn: () => submit({ data: { property_id: id, service_date: serviceDate } }),
    onSuccess: () => {
      toast.success("Nightly report submitted");
      try { localStorage.setItem(`submitted:${id}:${serviceDate}`, "1"); } catch {}
      qc.invalidateQueries({ queryKey: ["checklist", id, serviceDate] });
      navigate({ to: "/supervisor" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  return (
    <div>
      <Link to="/supervisor" className="inline-flex items-center text-sm text-muted-foreground hover:text-gold">
        <ArrowLeft className="mr-1 h-3 w-3" /> Properties
      </Link>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">{data?.property?.name}</h1>
          <p className="text-sm text-muted-foreground">Service date: {serviceDate}</p>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn("justify-start text-left font-normal")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(parseYmd(serviceDate), "PPP")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={parseYmd(serviceDate)}
              onSelect={(d) => {
                if (!d) return;
                setUserPicked(true);
                setServiceDate(formatYmd(d));
              }}
              disabled={(d) => d > today}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>

      <Tabs defaultValue="nightly" className="mt-6">
        <TabsList>
          <TabsTrigger value="nightly">Nightly Checklist</TabsTrigger>
          <TabsTrigger value="special">Special Projects</TabsTrigger>
        </TabsList>

        <TabsContent value="nightly" className="mt-4">
          <div className="mb-4 flex justify-end">
            <Button onClick={() => submitReport.mutate()} disabled={submitReport.isPending}>
              {submitReport.isPending ? "Submitting…" : "Submit nightly report"}
            </Button>
          </div>
          <div className="space-y-3">
            {(data?.areas ?? []).map((area: any) => {
              const upload = (data?.uploads ?? []).find((u: any) => u.area_id === area.id);
              return (
                <AreaCard key={`${area.id}-${serviceDate}`} area={area} upload={upload} property_id={id} service_date={serviceDate}
                  record={record} updateNotes={updateNotes}
                  onChange={() => qc.invalidateQueries({ queryKey: ["checklist", id, serviceDate] })} />
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="special" className="mt-4">
          <SpecialProjectsManager property_id={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AreaCard({ area, upload, property_id, service_date, record, updateNotes, onChange }: any) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [notes, setNotes] = useState(upload?.notes ?? "");
  const [showMedia, setShowMedia] = useState(false);
  const sign = useServerFn(signMediaUrl);

  const filePath = upload?.file_url as string | undefined;
  const { data: signed } = useQuery({
    queryKey: ["sign-media", filePath],
    queryFn: () => sign({ data: { path: filePath! } }),
    enabled: !!filePath && showMedia,
    staleTime: 50 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
  const previewUrl = signed?.url ?? null;

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
      setShowMedia(true);
      onChange();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
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
        <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        <Button size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Camera className="mr-2 h-4 w-4" /> {upload?.file_url ? "Replace" : "Upload"}</>}
        </Button>
      </div>

      {upload?.file_url && (
        <button onClick={() => setShowMedia((s) => !s)} className="mt-3 text-xs text-gold underline-offset-2 hover:underline">
          {showMedia ? "Hide" : "View"} {upload.file_type}
        </button>
      )}
      {showMedia && previewUrl && (
        <div className="mt-2 aspect-video overflow-hidden rounded-md bg-secondary">
          {upload?.file_type === "video"
            ? <video src={previewUrl} controls playsInline className="h-full w-full object-cover bg-black" />
            : <img src={previewUrl} alt="" className="h-full w-full object-cover" />}
        </div>
      )}

      <Textarea className="mt-3" rows={2} placeholder="Notes (optional)…" value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={() => upload?.id && notes !== (upload.notes ?? "") && updateNotes({ data: { id: upload.id, notes } }).then(onChange)} />
    </div>
  );
}
