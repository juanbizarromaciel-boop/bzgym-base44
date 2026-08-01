import React from "react";
import { Navigate } from "react-router-dom";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import DashboardAssinante from "@/components/dashboard/DashboardAssinante";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";

export default function SubscriberDashboard() {
  const { user, loading } = useCurrentUser();
  if (loading) return <DashboardSkeleton />;
  if (!user || user.role !== "assinante") return <Navigate to="/AccessDenied" replace />;
  return <DashboardAssinante user={user} />;
}