import { Skeleton } from '@/components/ui/skeleton';

export default function FundDetailSkeleton() {
  return (
    <div className="page-content">
      <div className="grid grid-cols-3 gap-2.5">
        {[1, 2, 3].map(i => (
          <div key={i} className="stat-card text-center">
            <Skeleton className="h-3 w-14 mx-auto mb-2" />
            <Skeleton className="h-5 w-16 mx-auto" />
          </div>
        ))}
      </div>
      <Skeleton className="h-12 w-full rounded-xl" />
      <div className="space-y-2.5">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
