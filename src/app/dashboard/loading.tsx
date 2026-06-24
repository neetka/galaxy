export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f8f9fb]">
      {/* Header skeleton */}
      <div className="h-14 border-b border-gray-200/60 bg-white/80" />

      {/* Content */}
      <div className="mx-auto w-full max-w-6xl px-6 py-8">
        <div className="mb-6 h-4 w-40 animate-pulse rounded bg-gray-200" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-52 animate-pulse rounded-2xl border border-gray-100 bg-white/60"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
