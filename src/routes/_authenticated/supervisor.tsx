import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { RoleShell } from "@/components/role-shell";
import { Building2, CalendarDays, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/_authenticated/supervisor")({
  component: SupervisorLayout,
});

function SupervisorLayout() {
  const { role } = useAuth();
  if (role !== "supervisor") return <Navigate to="/" />;
  return (
    <RoleShell brandSubtitle="Supervisor" items={[
      { to: "/supervisor", label: "Properties", icon: Building2 },
      { to: "/supervisor/issues", label: "Issues", icon: MessageSquare, showUnread: true },
    ]}>
      <Outlet />
    </RoleShell>
  );
}
