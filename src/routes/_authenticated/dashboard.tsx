import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { AdminDashboard } from "@/components/AdminDashboard";
import { MemberDashboard } from "@/components/MemberDashboard";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardRouter,
});

function DashboardRouter() {
  const { role } = useAuth();
  if (role === "admin") return <AdminDashboard />;
  return <MemberDashboard />;
}
