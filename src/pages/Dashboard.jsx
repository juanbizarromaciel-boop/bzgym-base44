import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Zap } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading } = useCurrentUser();

  useEffect(() => {
    if (loading || !user) return;
    if (user.role === "admin") navigate("/AdminDashboard", { replace: true });
    else if (user.role === "personal") navigate("/PersonalDashboard", { replace: true });
    else if (user.role === "assinante") navigate("/SubscriberDashboard", { replace: true });
    else navigate("/StudentDashboard", { replace: true });
  }, [user, loading, navigate]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="relative">
        <div className="w-12 h-12 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Zap className="w-4 h-4 text-purple-400" />
        </div>
      </div>
    </div>
  );
}