import React from "react";
import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import DashboardAdmin from "@/components/dashboard/DashboardAdmin";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";
import DashboardErrorState from "@/components/dashboard/DashboardErrorState";

export default function AdminDashboard() {
  const { user, loading } = useCurrentUser();
  const enabled = user?.role === "admin";
  const summaryQuery = useQuery({
    queryKey: ["admin-dashboard-summary"],
    queryFn: async () => (await base44.functions.invoke("getAdminDashboardSummary", {})).data,
    enabled,
    staleTime: 30000,
    refetchInterval: 60000,
  });

  if (loading || (enabled && summaryQuery.isLoading)) return <DashboardSkeleton />;
  if (!user || user.role !== "admin") return <Navigate to="/AccessDenied" replace />;
  if (summaryQuery.isError) return <DashboardErrorState onRetry={() => summaryQuery.refetch()} />;
  const summary = summaryQuery.data || { metrics: {}, monthlyRevenue: 0, recentActivity: [] };
  return <DashboardAdmin user={user} metrics={summary.metrics} monthlyRevenue={summary.monthlyRevenue} recentActivity={summary.recentActivity} />;
}