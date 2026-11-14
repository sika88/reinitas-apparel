import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <div role="status" className="container-page py-8 sm:py-12">
      <span className="sr-only">Loading product…</span>
      <Skeleton className="h-4 w-64" />
      <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <Skeleton className="aspect-[4/5] rounded-2xl" />
          <div className="mt-3 grid grid-cols-5 gap-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}
