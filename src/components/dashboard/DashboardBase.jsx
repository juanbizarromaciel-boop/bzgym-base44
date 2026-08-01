import React from "react";
import DashboardGreeting from "@/components/dashboard/DashboardGreeting";

export default function DashboardBase({ user, profileName, roleLabel, children }) {
  return (
    <div className="premium-app-shell mx-auto min-h-screen w-full max-w-[430px] space-y-4 overflow-x-hidden px-4 pb-[calc(105px+env(safe-area-inset-bottom))] pt-3 font-body text-professor">
      <DashboardGreeting user={user} profileName={profileName} roleLabel={roleLabel} />
      {children}
    </div>
  );
}