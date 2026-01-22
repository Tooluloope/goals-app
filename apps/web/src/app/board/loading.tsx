import { Skeleton } from '@/components/ui/skeleton';

export default function BoardLoading() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar skeleton - hidden on mobile */}
      <div className="hidden w-64 border-r bg-muted/30 p-4 md:block">
        <Skeleton className="mb-6 h-8 w-32" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <Skeleton className="h-7 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24 rounded-lg" />
            <Skeleton className="h-9 w-28 rounded-xl" />
          </div>
        </div>

        {/* Board columns */}
        <div className="flex gap-4 overflow-x-auto p-4">
          {[1, 2, 3, 4].map((col) => (
            <div key={col} className="min-w-[280px] space-y-3">
              <Skeleton className="h-10 w-24 rounded-lg" />
              {[1, 2, 3].map((card) => (
                <div key={card} className="rounded-xl border bg-card p-4">
                  <Skeleton className="mb-2 h-5 w-3/4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-14 rounded-full" />
                  </div>
                  <Skeleton className="mt-3 h-2 w-full rounded-full" />
                  <Skeleton className="mt-3 h-4 w-20" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
