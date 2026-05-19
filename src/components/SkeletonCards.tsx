export function SkeletonCard({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="p-3 rounded-2xl bg-card/50 animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="w-full aspect-square rounded-xl bg-muted/50 shimmer mb-3" />
      <div className="h-3.5 bg-muted/50 rounded-full shimmer w-3/4 mb-2" />
      <div className="h-3 bg-muted/50 rounded-full shimmer w-1/2" />
    </div>
  );
}

export function SkeletonRow({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="flex items-center gap-4 px-4 py-2.5 rounded-xl animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="w-8 h-4 bg-muted/50 rounded shimmer" />
      <div className="w-10 h-10 rounded-lg bg-muted/50 shimmer flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="h-3.5 bg-muted/50 rounded-full shimmer w-2/3 mb-2" />
        <div className="h-3 bg-muted/50 rounded-full shimmer w-1/3" />
      </div>
      <div className="w-10 h-3 bg-muted/50 rounded-full shimmer" />
    </div>
  );
}

export function SkeletonHero() {
  return (
    <div className="rounded-3xl bg-card/30 p-8 md:p-10 shimmer mb-8">
      <div className="h-3 bg-muted/50 rounded-full w-32 mb-4 shimmer" />
      <div className="h-10 bg-muted/50 rounded-xl w-64 mb-3 shimmer" />
      <div className="h-4 bg-muted/50 rounded-full w-48 mb-6 shimmer" />
      <div className="h-11 bg-muted/50 rounded-full w-40 shimmer" />
    </div>
  );
}

export function SkeletonQuickPick({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="flex items-center gap-3 bg-card/30 rounded-xl overflow-hidden animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="w-14 h-14 bg-muted/50 shimmer flex-shrink-0" />
      <div className="h-3.5 bg-muted/50 rounded-full shimmer w-24" />
    </div>
  );
}
