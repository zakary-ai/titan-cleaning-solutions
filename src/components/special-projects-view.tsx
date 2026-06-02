import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useMemo, useRef } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Link } from "@tanstack/react-router";
import { Camera, Loader2, Plus, MessageSquarePlus, MessagesSquare, Sparkles } from "lucide-react";
import { DeleteMenu } from "@/components/delete-menu";
import { supabase } from "@/integrations/supabase/client";
import {
  listSpecialProjects,
  listSpecialProjectDates,
  getSpecialProjectsByDate,
  createSpecialProject,
  deleteSpecialProject,
} from "@/lib/special-projects.functions";
import { signMediaUrl } from "@/lib/uploads.functions";
import { createIssue } from "@/lib/issues.functions";
import { cn } from "@/lib/utils";

type Mode = "supervisor" | "client" | "admin";

export function SpecialProjectsCalendar({
  property_id,
  mode,
  issuesLinkTo = "/client/issues",
}: {
  property_id: string;
  mode: Mode;
  issuesLinkTo?: string;
}) {
  const datesFn = useServerFn(listSpecialProjectDates);
  const { data: dates = [] } = useQuery({
    queryKey: ["sp-dates", property_id],
    queryFn: () => datesFn({ data: { property_id } }),
  });
  const dateSet = useMemo(() => new Set(dates as string[]), [dates]);
  const days = useMemo(
    () => (dates as string[]).map((d) => new Date(d + "T00:00:00")),
    [dates],
  );
  const [selected, setSelected] = useState<Date | undefined>();
  const selectedStr = selected ? format(selected, "yyyy-MM-dd") : undefined;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-card p-4 gold-border">
        <h2 className="font-display text-lg">Special Projects</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Days with special projects are highlighted in gold.
        </p>
        <div className="mt-3 flex justify-center">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={setSelected}
            modifiers={{ has: days }}
            modifiersClassNames={{ has: "bg-gold/15 text-gold font-semibold rounded-md" }}
            disabled={(date) => !dateSet.has(format(date, "yyyy-MM-dd"))}
            className={cn("p-3 pointer-events-auto")}
          />
        </div>
      </div>

      {selectedStr ? (
        <SpecialProjectsForDate
          property_id={property_id}
          project_date={selectedStr}
          mode={mode}
          issuesLinkTo={issuesLinkTo}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          Select a highlighted day to view the special projects from that day.
        </p>
      )}
    </div>
  );
}

function SpecialProjectsForDate({
  property_id, project_date, mode, issuesLinkTo,
}: { property_id: string; project_date: string; mode: Mode; issuesLinkTo: string }) {
  const fn = useServerFn(getSpecialProjectsByDate);
  const { data = [] } = useQuery({
    queryKey: ["sp-by-date", property_id, project_date],
    queryFn: () => fn({ data: { property_id, project_date } }),
  });
  if ((data as any[]).length === 0) {
    return <p className="text-sm text-muted-foreground">No special projects on this day.</p>;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {(data as any[]).map((sp) => (
        <SpecialProjectCard key={sp.id} sp={sp} mode={mode} issuesLinkTo={issuesLinkTo} />
      ))}
    </div>
  );
}

export function SpecialProjectsManager({ property_id }: { property_id: string }) {
  const listFn = useServerFn(listSpecialProjects);
  const createFn = useServerFn(createSpecialProject);
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["sp-list", property_id],
    queryFn: () => listFn({ data: { property_id } }),
  });

  const [open, setOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["sp-list", property_id] });
    qc.invalidateQueries({ queryKey: ["sp-dates", property_id] });
    qc.invalidateQueries({ queryKey: ["sp-by-date", property_id] });
  };

  const onPickFile = async (file: File) => {
    if (!caption.trim()) {
      toast.error("Add a caption first");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "bin";
      const path = `${property_id}/special/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("cleaning-media").upload(path, file, { upsert: true });
      if (error) throw error;
      const file_type = file.type.startsWith("video") ? "video" : "image";
      await createFn({ data: { property_id, caption: caption.trim(), file_url: path, file_type } });
      toast.success("Special project posted");
      setCaption("");
      setOpen(false);
      invalidate();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-gold" /> Special Projects
          </h2>
          <p className="text-xs text-muted-foreground">Power washing, marble cleaning, anything outside the nightly routine.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-2 h-4 w-4" /> New</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Special Project</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Caption</Label>
                <Input value={caption} onChange={(e) => setCaption(e.target.value)}
                  placeholder="e.g. Power Washing" />
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && onPickFile(e.target.files[0])}
              />
              <Button
                className="w-full"
                disabled={uploading || !caption.trim()}
                onClick={() => fileRef.current?.click()}
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> :
                  <><Camera className="mr-2 h-4 w-4" /> Record / choose media</>}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {(data as any[]).length === 0 ? (
        <p className="text-sm text-muted-foreground">No special projects yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {(data as any[]).map((sp) => (
            <SpecialProjectCard key={sp.id} sp={sp} mode="supervisor" issuesLinkTo="/supervisor/issues" />
          ))}
        </div>
      )}
    </div>
  );
}

function SpecialProjectCard({
  sp, mode, issuesLinkTo,
}: { sp: any; mode: Mode; issuesLinkTo: string }) {
  const sign = useServerFn(signMediaUrl);
  const del = useServerFn(deleteSpecialProject);
  const create = useServerFn(createIssue);
  const qc = useQueryClient();
  const [url, setUrl] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: `Re: ${sp.caption}`, initial_comment: "" });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (sp.file_url) sign({ data: { path: sp.file_url } }).then(({ url }) => setUrl(url));
  }, [sp.file_url]);

  const delMut = useMutation({
    mutationFn: () => del({ data: { id: sp.id } }),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["sp-list", sp.property_id] });
      qc.invalidateQueries({ queryKey: ["sp-dates", sp.property_id] });
      qc.invalidateQueries({ queryKey: ["sp-by-date", sp.property_id] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const commentMut = useMutation({
    mutationFn: () => create({ data: {
      property_id: sp.property_id,
      special_project_id: sp.id,
      title: form.title,
      initial_comment: form.initial_comment,
    } }),
    onSuccess: () => {
      toast.success("Comment sent");
      setOpen(false);
      setSubmitted(true);
      setForm({ title: `Re: ${sp.caption}`, initial_comment: "" });
      qc.invalidateQueries({ queryKey: ["issues"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="overflow-hidden rounded-xl bg-card gold-border">
      <div className="aspect-video bg-secondary">
        {url && sp.file_type === "video" && <video src={url} controls playsInline {...({ "webkit-playsinline": "true" } as any)} className="h-full w-full object-cover" />}
        {url && sp.file_type === "image" && <img src={url} alt={sp.caption} className="h-full w-full object-cover" />}
        {!url && <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Loading…</div>}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-display text-base truncate">{sp.caption}</h3>
            <div className="mt-1 text-[10px] text-muted-foreground">
              {format(new Date(sp.created_at), "PPp")}
            </div>
          </div>
          {(mode === "supervisor" || mode === "admin") && (
            <DeleteMenu
              title={`Delete "${sp.caption}"?`}
              description="This permanently removes this special project (media and caption). This cannot be undone."
              pending={delMut.isPending}
              onConfirm={() => delMut.mutate()}
            />
          )}
        </div>

        {mode === "client" && (
          submitted ? (
            <Button asChild size="sm" variant="outline" className="mt-3 w-full">
              <Link to={issuesLinkTo}>
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
                <DialogHeader><DialogTitle>Comment on {sp.caption}</DialogTitle></DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); commentMut.mutate(); }} className="space-y-3">
                  <div><Label>Subject</Label>
                    <Input required value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder={`Re: ${sp.caption}`} /></div>
                  <div><Label>Comment</Label>
                    <Textarea required rows={4} value={form.initial_comment}
                      onChange={(e) => setForm({ ...form, initial_comment: e.target.value })} /></div>
                  <Button type="submit" disabled={commentMut.isPending} className="w-full">
                    {commentMut.isPending ? "Sending…" : "Send"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )
        )}
      </div>
    </div>
  );
}
