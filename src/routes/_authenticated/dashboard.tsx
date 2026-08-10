import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { AdminDashboard } from "@/components/AdminDashboard";
import { MemberDashboard } from "@/components/MemberDashboard";
import { HrDashboard } from "@/components/HrDashboard";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardRouter,
});

function DashboardRouter() {
  const { role } = useAuth();
  if (role === "hr") return <HrDashboard />;
  if (role === "admin") return <AdminDashboard />;
  return <MemberDashboard />;
}
