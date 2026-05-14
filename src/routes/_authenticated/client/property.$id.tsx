import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/client/property/$id")({
  beforeLoad: () => {
    throw redirect({ to: "/client" });
  },
  component: () => null,
});
