import React from "react";
import { Navigate } from "react-router-dom";

const homes = {
  admin: "/AdminDashboard",
  personal: "/PersonalDashboard",
  user: "/StudentDashboard",
  assinante: "/SubscriberDashboard",
};

export default function RoleRoute({ user, allowed, children }) {
  if (!allowed.includes(user?.role)) return <Navigate to={homes[user?.role] || "/AccessDenied"} replace />;
  return children;
}