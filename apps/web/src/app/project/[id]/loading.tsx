import { Skeleton } from '@/components/ui/skeleton';

export default function ProjectDetailLoading() {
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
        {/* Back button and title */}
        <div className="mb-6">
          <Skeleton className="mb-4 h-6 w-20" />
          <Skeleton className="mb-2 h-9 w-80" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </div>

        {/* Progress section */}
        <div className="mb-6 rounded-xl border bg-card p-4">
          <Skeleton className="mb-3 h-5 w-24" />
          <Skeleton className="h-3 w-full rounded-full" />
          <div className="mt-2 flex justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {[1, 2, 3].map((section) => (
            <div key={section} className="rounded-xl border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
              <div className="space-y-2">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <Skeleton className="h-5 w-5 rounded" />
                    <Skeleton className="h-5 w-full" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
