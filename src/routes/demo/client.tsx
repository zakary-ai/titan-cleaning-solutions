import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DemoShell } from "@/components/demo/demo-shell";

export const Route = createFileRoute("/demo/client")({
  component: () => (
    <DemoShell>
      <Outlet />
    </DemoShell>
  ),
});
