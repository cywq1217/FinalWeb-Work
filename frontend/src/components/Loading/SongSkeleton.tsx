export default function SongSkeleton() {
  return (
    <div className="animate-pulse flex items-center gap-4 p-3 rounded-lg">
      {/* 序号 */}
      <div className="w-10 flex items-center justify-center">
        <div className="w-6 h-4 bg-gray-200 rounded" />
      </div>

      {/* 封面 */}
      <div className="w-12 h-12 bg-gray-200 rounded-lg" />

      {/* 歌曲信息 */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>

      {/* 专辑 */}
      <div className="hidden md:block w-48">
        <div className="h-3 bg-gray-200 rounded w-2/3" />
      </div>

      {/* 时长 */}
      <div className="w-12">
        <div className="h-3 bg-gray-200 rounded" />
      </div>
    </div>
  );
}

export function SongListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: count }).map((_, i) => (
        <SongSkeleton key={i} />
      ))}
    </div>
  );
}
