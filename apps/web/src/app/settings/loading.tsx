import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsLoading() {
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
        <Skeleton className="mb-6 h-8 w-32" />

        {/* Settings sections */}
        <div className="space-y-6">
          {[1, 2, 3].map((section) => (
            <div key={section} className="rounded-xl border bg-card p-6">
              <Skeleton className="mb-4 h-6 w-40" />
              <div className="space-y-4">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="flex items-center justify-between">
                    <div>
                      <Skeleton className="mb-1 h-5 w-32" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                    <Skeleton className="h-6 w-12 rounded-full" />
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
