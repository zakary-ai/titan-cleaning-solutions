import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listIssues, getIssueThread, replyToIssue, setIssueStatus } from "@/lib/issues.functions";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { toast } from "sonner";

export function IssuesInbox({ canChangeStatus = false }: { canChangeStatus?: boolean }) {
  const list = useServerFn(listIssues);
  const get = useServerFn(getIssueThread);
  const reply = useServerFn(replyToIssue);
  const setStatus = useServerFn(setIssueStatus);
  const qc = useQueryClient();

  const [filter, setFilter] = useState<"all" | "open" | "in_progress" | "resolved">("open");
  const [selected, setSelected] = useState<string | null>(null);
  const [body, setBody] = useState("");

  const { data } = useQuery({ queryKey: ["issues", filter], queryFn: () => list({ data: { status: filter } }) });
  const { data: thread } = useQuery({
    queryKey: ["issue", selected], queryFn: () => get({ data: { id: selected! } }), enabled: !!selected,
  });

  const sendReply = useMutation({
    mutationFn: () => reply({ data: { issue_id: selected!, body } }),
    onSuccess: () => { setBody(""); qc.invalidateQueries({ queryKey: ["issue", selected] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Issues</h1>
        <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-[320px_1fr]">
        <div className="space-y-2">
          {(data?.issues ?? []).map((i: any) => {
            const p = data!.properties[i.property_id];
            const a = i.area_id ? data!.areas[i.area_id] : null;
            return (
              <button key={i.id} onClick={() => setSelected(i.id)}
                className={`w-full rounded-lg border p-3 text-left transition ${selected === i.id ? "border-gold bg-card" : "border-border bg-card/50 hover:bg-card"}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{i.title}</span>
                  <span className="text-[10px] uppercase text-gold">{i.status}</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{p?.name} · {a?.area_name ?? "—"}</div>
                <div className="text-[10px] text-muted-foreground">{format(new Date(i.created_at), "MMM d, p")}</div>
              </button>
            );
          })}
          {(data?.issues ?? []).length === 0 && <p className="text-sm text-muted-foreground">No issues.</p>}
        </div>

        <div className="rounded-xl bg-card p-5 gold-border min-h-[300px]">
          {!thread && <p className="text-sm text-muted-foreground">Select an issue to view the thread.</p>}
          {thread && (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl">{thread.issue.title}</h2>
                  <p className="text-xs text-muted-foreground">
                    {thread.property?.name} · {thread.area?.area_name ?? "—"} · {format(new Date(thread.issue.created_at), "PPp")}
                  </p>
                </div>
                {canChangeStatus && (
                  <Select value={thread.issue.status} onValueChange={(v: any) => setStatus({ data: { id: thread.issue.id, status: v } }).then(() => qc.invalidateQueries({ queryKey: ["issues"] })).then(() => qc.invalidateQueries({ queryKey: ["issue", selected] }))}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="mt-4 space-y-3">
                {thread.messages.map((m: any) => {
                  const sender = m.sender_id ? thread.profiles[m.sender_id] : null;
                  return (
                    <div key={m.id} className="rounded-md bg-secondary p-3">
                      <div className="text-xs text-gold">{sender?.full_name || sender?.email || "User"}</div>
                      <div className="mt-1 whitespace-pre-wrap text-sm">{m.body}</div>
                      <div className="mt-1 text-[10px] text-muted-foreground">{format(new Date(m.created_at), "PPp")}</div>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={(e) => { e.preventDefault(); if (body.trim()) sendReply.mutate(); }} className="mt-4 space-y-2">
                <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a reply…" rows={3} />
                <Button type="submit" disabled={sendReply.isPending || !body.trim()}>Send reply</Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
