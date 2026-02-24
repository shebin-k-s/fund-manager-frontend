import { Skeleton } from '@/components/ui/skeleton';

export default function FundListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2.5 mb-3">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <div className="flex-1">
              <Skeleton className="h-4 w-28 mb-1.5" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-3 w-20 mb-1" />
              <Skeleton className="h-6 w-24" />
            </div>
            <Skeleton className="h-7 w-16 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
