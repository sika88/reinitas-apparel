import { ProductGridSkeleton, Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <div role="status" className="container-page py-10 sm:py-14">
      <span className="sr-only">Loading products…</span>
      <Skeleton className="h-4 w-16" />
      <Skeleton className="mt-3 h-12 w-64" />
      <div className="mt-8 flex gap-2">
        <Skeleton className="h-10 w-16 rounded-full" />
        <Skeleton className="h-10 w-24 rounded-full" />
        <Skeleton className="h-10 w-24 rounded-full" />
        <Skeleton className="h-10 w-24 rounded-full" />
      </div>
      <div className="mt-10">
        <ProductGridSkeleton />
      </div>
    </div>
  );
}
