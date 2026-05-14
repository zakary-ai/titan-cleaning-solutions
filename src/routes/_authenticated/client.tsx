import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { RoleShell } from "@/components/role-shell";
import { Home, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/_authenticated/client")({
  component: ClientLayout,
});

function ClientLayout() {
  const { role } = useAuth();
  if (role !== "client") return <Navigate to="/" />;
  return (
    <RoleShell brandSubtitle="Client Portal" items={[
      { to: "/client", label: "Properties", icon: Home },
      { to: "/client/issues", label: "Comments", icon: MessageSquare },
    ]}>
      <Outlet />
    </RoleShell>
  );
}
