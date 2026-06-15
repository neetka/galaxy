export default function WorkflowLoading() {
  return (
    <div className="flex h-screen items-center justify-center bg-[#09090b]">
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        {/* Concentric rings loader */}
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full border-2 border-purple-500/20 animate-ping" />
          <div className="absolute inset-2 rounded-full border-2 border-purple-500/30 animate-pulse" />
          <div className="absolute inset-4 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
        </div>
        <p className="text-sm text-zinc-500">Loading workflow...</p>
      </div>
    </div>
  );
}
