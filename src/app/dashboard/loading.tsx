export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-[#09090b]">
      {/* Header skeleton */}
      <div className="h-16 border-b border-zinc-800 bg-[#09090b]/80" />

      {/* Content */}
      <div className="mx-auto w-full max-w-7xl px-6 py-8">
        <div className="mb-6 h-4 w-40 animate-pulse rounded bg-zinc-800" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-52 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/50"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
