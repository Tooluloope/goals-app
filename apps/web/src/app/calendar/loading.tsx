import { Skeleton } from '@/components/ui/skeleton';

export default function CalendarLoading() {
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
      <div className="flex-1 p-4 md:p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-10 w-10 rounded-lg" />
          </div>
          <Skeleton className="h-10 w-24 rounded-xl" />
        </div>

        {/* Calendar grid */}
        <div className="rounded-xl border bg-card">
          {/* Days header */}
          <div className="grid grid-cols-7 border-b">
            {[1, 2, 3, 4, 5, 6, 7].map((day) => (
              <div key={day} className="p-3 text-center">
                <Skeleton className="mx-auto h-4 w-8" />
              </div>
            ))}
          </div>

          {/* Calendar cells */}
          {[1, 2, 3, 4, 5].map((week) => (
            <div key={week} className="grid grid-cols-7">
              {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                <div key={day} className="min-h-24 border-b border-r p-2 last:border-r-0">
                  <Skeleton className="mb-2 h-6 w-6 rounded-full" />
                  {day % 3 === 0 && <Skeleton className="h-5 w-full rounded" />}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
