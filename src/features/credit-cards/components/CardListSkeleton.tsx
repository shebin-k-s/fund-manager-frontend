import { Skeleton } from '@/components/ui/skeleton';
import React from 'react'

type Props = {}

const CardListSkeleton = (props: Props) => {
  return (
    <div className="space-y-4">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="w-full aspect-[1.7/1] rounded-2xl p-5 bg-muted/40 relative overflow-hidden"
        >
          <div className="flex justify-between items-start">
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-6 w-10 rounded-md" />
          </div>

          <div className="mt-8">
            <Skeleton className="h-5 w-40 rounded-md" />
          </div>

          <div className="absolute bottom-5 left-5 right-5 flex justify-between">
            <Skeleton className="h-4 w-20 rounded-md" />
            <Skeleton className="h-4 w-12 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default CardListSkeleton