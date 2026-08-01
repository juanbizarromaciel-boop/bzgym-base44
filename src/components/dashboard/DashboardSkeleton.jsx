import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardSkeleton() {
  return <div className="mx-auto min-h-screen w-full max-w-[430px] space-y-5 bg-professor-bg px-4 pb-28 pt-3"><div className="grid grid-cols-[1fr_112px] items-end gap-4"><div className="space-y-2"><Skeleton className="h-5 w-28" /><Skeleton className="h-12 w-44" /><Skeleton className="h-8 w-36 rounded-full" /></div><Skeleton className="h-24 rounded-[18px]" /></div><Skeleton className="h-[150px] w-full rounded-[20px]" /><div className="grid grid-cols-4 gap-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-[150px] rounded-[18px]" />)}</div><div className="grid grid-cols-3 gap-2.5">{[1,2,3].map(i => <Skeleton key={i} className="h-[184px] rounded-[18px]" />)}</div><div className="grid grid-cols-2 gap-2.5"><Skeleton className="h-[154px] rounded-[18px]" /><Skeleton className="h-[154px] rounded-[18px]" /></div></div>;
}