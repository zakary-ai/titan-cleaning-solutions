import type { AppRole } from "@/hooks/use-auth";

export function homeForRole(role: AppRole | null): string {
  if (role === "admin") return "/admin";
  if (role === "supervisor") return "/supervisor";
  if (role === "client") return "/client";
  return "/login";
}
