import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardSkeleton() {
  return <div className="mx-auto max-w-5xl space-y-6"><div className="flex justify-between"><div className="space-y-2"><Skeleton className="h-5 w-28" /><Skeleton className="h-11 w-44" /><Skeleton className="h-9 w-36 rounded-full" /></div><Skeleton className="h-24 w-28 rounded-2xl" /></div><Skeleton className="h-48 w-full rounded-3xl" /><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{[1,2,3].map(i => <Skeleton key={i} className="h-44 rounded-2xl" />)}</div></div>;
}