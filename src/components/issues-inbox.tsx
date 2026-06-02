import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listIssues, getIssueThread, replyToIssue, setIssueStatus, markIssueRead, markAllIssuesRead, deleteIssue, deleteMessage } from "@/lib/issues.functions";
import { signMediaUrl } from "@/lib/uploads.functions";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Paperclip, Loader2, ArrowLeft, X, Film, CheckCheck } from "lucide-react";
import { DeleteMenu } from "@/components/delete-menu";

type FilterStatus = "open" | "resolved" | "all";
type IssueStatus = "open" | "resolved";

export function IssuesInbox({ canChangeStatus = false }: { canChangeStatus?: boolean }) {
  const list = useServerFn(listIssues);
  const get = useServerFn(getIssueThread);
  const reply = useServerFn(replyToIssue);
  const setStatus = useServerFn(setIssueStatus);
  const markRead = useServerFn(markIssueRead);
  const markAllRead = useServerFn(markAllIssuesRead);
  const qc = useQueryClient();

  const [filter, setFilter] = useState<FilterStatus>("open");
  const [selected, setSelected] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data } = useQuery({
    queryKey: ["issues", filter],
    queryFn: () => list({ data: { status: filter } }),
  });
  const { data: thread } = useQuery({
    queryKey: ["issue", selected],
    queryFn: () => get({ data: { id: selected! } }),
    enabled: !!selected,
  });

  // Mark thread read whenever it (re)loads
  useEffect(() => {
    if (!selected || !thread) return;
    markRead({ data: { issue_id: selected } })
      .then(() => qc.invalidateQueries({ queryKey: ["unread-issues"] }))
      .catch(() => {});
  }, [selected, thread, markRead, qc]);

  const [showVideo, setShowVideo] = useState(false);
  useEffect(() => { setShowVideo(false); }, [selected]);

  const sendReply = useMutation({
    mutationFn: async () => {
      let attachment_url: string | null = null;
      if (pendingFile && thread) {
        setUploading(true);
        try {
          const ext = pendingFile.name.split(".").pop() || "bin";
          const path = `${thread.issue.property_id}/messages/${thread.issue.id}/${Date.now()}.${ext}`;
          const { error } = await supabase.storage
            .from("cleaning-media").upload(path, pendingFile, { upsert: true });
          if (error) throw error;
          attachment_url = path;
        } finally {
          setUploading(false);
        }
      }
      return reply({ data: { issue_id: selected!, body: body.trim(), attachment_url } });
    },
    onSuccess: () => {
      setBody("");
      setPendingFile(null);
      qc.invalidateQueries({ queryKey: ["issue", selected] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const canSend = (body.trim().length > 0 || !!pendingFile) && !sendReply.isPending && !uploading;

  return (
    <div className="flex h-[calc(100vh-8rem)] min-w-0 flex-col overflow-x-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-2xl md:text-3xl">Comments</h1>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              markAllRead()
                .then(() => {
                  toast.success("All marked as read");
                  qc.invalidateQueries({ queryKey: ["unread-issues"] });
                })
                .catch((e: any) => toast.error(e.message))
            }
          >
            <CheckCheck className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Mark all read</span>
          </Button>
          <Select value={filter} onValueChange={(v: FilterStatus) => setFilter(v)}>
            <SelectTrigger className="w-28 md:w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-4 grid min-h-0 flex-1 gap-4 md:grid-cols-[320px_1fr]">
        {/* Issue list — scrolls independently */}
        <div className={`min-h-0 overflow-y-auto pr-1 ${selected ? "hidden md:block" : ""}`}>
          <div className="space-y-2">
            {(data?.issues ?? []).map((i: any) => {
              const p = data!.properties[i.property_id];
              const a = i.area_id ? data!.areas[i.area_id] : null;
              const sp = i.special_project_id ? (data as any).specialProjects?.[i.special_project_id] : null;
              const subtitle = sp ? `Special: ${sp.caption}` : (a?.area_name ?? "—");
              return (
                <button key={i.id} onClick={() => setSelected(i.id)}
                  className={`w-full rounded-lg border p-3 text-left transition ${selected === i.id ? "border-gold bg-card" : "border-border bg-card/50 hover:bg-card"}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold truncate">{i.title}</span>
                    <span className="text-[10px] uppercase text-gold">{i.status === "resolved" ? "resolved" : "open"}</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{p?.name} · {subtitle}</div>
                  <div className="text-[10px] text-muted-foreground">{format(new Date(i.created_at), "MMM d, p")}</div>
                </button>
              );
            })}
            {(data?.issues ?? []).length === 0 && <p className="text-sm text-muted-foreground">No comments.</p>}
          </div>
        </div>

        {/* Thread panel — fixed frame, only messages scroll */}
        <div className={`flex min-h-0 flex-col rounded-xl bg-card gold-border ${!selected ? "hidden md:flex" : ""}`}>
          {!thread && (
            <div className="flex h-full items-center justify-center p-5">
              <p className="text-sm text-muted-foreground">Select a comment to view the thread.</p>
            </div>
          )}
          {thread && (
            <>
              {/* Header */}
              <div className="flex items-start justify-between gap-3 border-b border-border/60 p-4">
                <div className="min-w-0 flex items-start gap-2">
                  <button onClick={() => setSelected(null)} className="md:hidden mt-1 text-muted-foreground hover:text-gold">
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div className="min-w-0">
                    <h2 className="font-display text-xl truncate">{thread.issue.title}</h2>
                    <p className="text-xs text-muted-foreground">
                      {thread.property?.name} · {(thread as any).special_project ? `Special: ${(thread as any).special_project.caption}` : (thread.area?.area_name ?? "—")} · {format(new Date(thread.issue.created_at), "PPp")}
                    </p>
                  </div>
                </div>
                {canChangeStatus && (
                  <Select
                    value={thread.issue.status === "resolved" ? "resolved" : "open"}
                    onValueChange={(v: IssueStatus) => setStatus({ data: { id: thread.issue.id, status: v } })
                      .then(() => qc.invalidateQueries({ queryKey: ["issues"] }))
                      .then(() => qc.invalidateQueries({ queryKey: ["issue", selected] }))
                      .then(() => qc.invalidateQueries({ queryKey: ["unread-issues"] }))}
                  >
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Original upload / special project the issue refers to */}
              {(() => {
                const sp = (thread as any).special_project;
                const media = thread.upload?.file_url
                  ? { path: thread.upload.file_url, type: thread.upload.file_type }
                  : sp?.file_url
                    ? { path: sp.file_url, type: sp.file_type }
                    : null;
                if (!media) return null;
                return (
                  <div className="border-b border-border/60 px-4 py-3">
                    <Button type="button" size="sm" variant="outline" onClick={() => setShowVideo((v) => !v)}>
                      <Film className="mr-2 h-4 w-4" />
                      {showVideo ? "Hide" : "View"} {media.type === "image" ? "photo" : "video"} in question
                    </Button>
                    {showVideo && (
                      <div className="mt-3">
                        <MessageAttachment path={media.path} />
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Messages — the only scrolling region */}
              <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-3">
                {thread.messages.map((m: any) => {
                  const sender = m.sender_id ? thread.profiles[m.sender_id] : null;
                  return (
                    <div key={m.id} className="rounded-md bg-secondary p-3">
                      <div className="text-xs text-gold">{sender?.full_name || sender?.email || "User"}</div>
                      {m.body && <div className="mt-1 whitespace-pre-wrap text-sm">{m.body}</div>}
                      {m.attachment_url && <MessageAttachment path={m.attachment_url} />}
                      <div className="mt-1 text-[10px] text-muted-foreground">{format(new Date(m.created_at), "PPp")}</div>
                    </div>
                  );
                })}
              </div>

              {/* Composer */}
              <form
                onSubmit={(e) => { e.preventDefault(); if (canSend) sendReply.mutate(); }}
                className="border-t border-border/60 p-3 space-y-2"
              >
                {pendingFile && (
                  <div className="flex items-center justify-between rounded-md bg-secondary px-3 py-2 text-xs">
                    <span className="truncate">{pendingFile.name}</span>
                    <button type="button" onClick={() => setPendingFile(null)} className="text-muted-foreground hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a reply…" rows={2} />
                <div className="flex items-center justify-between gap-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && setPendingFile(e.target.files[0])}
                  />
                  <Button type="button" size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
                    <Paperclip className="mr-2 h-4 w-4" /> Attach photo / video
                  </Button>
                  <Button type="submit" disabled={!canSend}>
                    {(sendReply.isPending || uploading) ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reply"}
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageAttachment({ path }: { path: string }) {
  const sign = useServerFn(signMediaUrl);
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => { sign({ data: { path } }).then((r) => setUrl(r.url)).catch(() => setUrl(null)); }, [path]);
  if (!url) return <div className="mt-2 h-32 w-full animate-pulse rounded-md bg-background/40" />;
  const isVideo = /\.(mp4|mov|webm|m4v|ogg)$/i.test(path);
  return isVideo
    ? <video src={url} controls playsInline className="mt-2 max-h-72 w-full rounded-md bg-black" />
    : <img src={url} alt="" className="mt-2 max-h-72 w-full rounded-md object-cover" />;
}
