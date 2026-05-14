import { createFileRoute } from "@tanstack/react-router";
import { IssuesInbox } from "@/components/issues-inbox";

export const Route = createFileRoute("/_authenticated/admin/issues")({
  component: () => <IssuesInbox canChangeStatus />,
});
