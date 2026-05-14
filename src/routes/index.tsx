import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { homeForRole } from "@/lib/role-routes";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { loading, session, role } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Sparkles className="h-6 w-6 animate-pulse text-gold" />
      </div>
    );
  }

  if (!session) return <Navigate to="/login" />;
  if (!role) return <Navigate to="/pending" />;
  return <Navigate to={homeForRole(role)} />;
}
