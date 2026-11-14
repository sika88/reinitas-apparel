import { ProductGridSkeleton, Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <div role="status" className="container-page py-12">
      <span className="sr-only">Loading…</span>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-4 h-12 w-72" />
      <div className="mt-10">
        <ProductGridSkeleton />
      </div>
    </div>
  );
}
