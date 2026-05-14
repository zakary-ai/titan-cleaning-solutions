import { createFileRoute } from "@tanstack/react-router";
import { IssuesInbox } from "@/components/issues-inbox";

export const Route = createFileRoute("/_authenticated/supervisor/issues")({
  component: () => <IssuesInbox />,
});
