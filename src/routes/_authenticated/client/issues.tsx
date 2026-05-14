import { createFileRoute } from "@tanstack/react-router";
import { IssuesInbox } from "@/components/issues-inbox";

export const Route = createFileRoute("/_authenticated/client/issues")({
  component: () => <IssuesInbox />,
});
