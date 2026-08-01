import React from "react";

export default function DashboardBase({ children }) {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-4 font-body text-foreground sm:space-y-7">
      {children}
    </div>
  );
}