import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { RoleShell } from "@/components/role-shell";
import { LayoutDashboard, Building2, Users, MessageSquare, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { role } = useAuth();
  if (role !== "admin") return <Navigate to="/" />;
  return (
    <RoleShell brandSubtitle="Admin" items={[
      { to: "/admin", label: "Overview", icon: LayoutDashboard },
      { to: "/admin/properties", label: "Properties", icon: Building2 },
      { to: "/admin/users", label: "Users", icon: Users },
      { to: "/admin/issues", label: "Comments", icon: MessageSquare, showUnread: true },
      { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    ]}>
      <Outlet />
    </RoleShell>
  );
}
