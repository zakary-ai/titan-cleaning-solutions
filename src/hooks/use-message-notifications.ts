import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useNavigate, useRouterState } from "@tanstack/react-router";

/**
 * Watches the unread-issue count and fires a toast + browser Notification
 * whenever it increases (i.e. a new message arrived). Notification permission
 * is requested lazily on first user interaction.
 */
export function useMessageNotifications(unreadCount: number, issuesPath: string) {
  const prev = useRef<number | null>(null);
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  // Lazy-request browser notification permission on first user gesture.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;
    if (Notification.permission !== "default") return;
    const ask = () => {
      Notification.requestPermission().catch(() => {});
      window.removeEventListener("pointerdown", ask);
    };
    window.addEventListener("pointerdown", ask, { once: true });
    return () => window.removeEventListener("pointerdown", ask);
  }, []);

  useEffect(() => {
    if (prev.current === null) {
      prev.current = unreadCount;
      return;
    }
    if (unreadCount > prev.current) {
      const delta = unreadCount - prev.current;
      const onIssues = path.startsWith(issuesPath);
      if (!onIssues) {
        toast(`${delta} new message${delta > 1 ? "s" : ""}`, {
          description: "Tap to open the Comments inbox",
          duration: 3000,
          action: { label: "View", onClick: () => navigate({ to: issuesPath }) },
        });
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted" && document.visibilityState !== "visible") {
          try {
            const n = new Notification("New message", {
              body: `${delta} new message${delta > 1 ? "s" : ""} in your Comments inbox`,
              icon: "/icon-512.png",
              tag: "titan-unread-issues",
            });
            n.onclick = () => { window.focus(); navigate({ to: issuesPath }); n.close(); };
          } catch {}
        }
      }
    }
    prev.current = unreadCount;
  }, [unreadCount, path, issuesPath, navigate]);
}
