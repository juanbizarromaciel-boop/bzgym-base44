import React from "react";

export default function DashboardBase({ children }) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-[430px] space-y-5 overflow-x-hidden bg-professor-bg px-4 pb-[calc(105px+env(safe-area-inset-bottom))] pt-3 font-body text-professor">
      {children}
    </div>
  );
}