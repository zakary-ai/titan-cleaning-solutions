import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/client/property/$id")({
  component: () => <Navigate to="/client" />,
});
