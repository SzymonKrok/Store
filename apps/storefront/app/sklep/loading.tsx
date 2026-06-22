export default function ShopLoading() {
  return (
    <main className="min-h-screen bg-ink">
      <div className="relative overflow-hidden bg-ink-950">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold/10 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/3 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-px bg-gold" />
            <div className="h-2.5 w-20 bg-ink-600 rounded animate-pulse" />
          </div>
          <div className="h-14 w-72 bg-ink-700 rounded animate-pulse mb-2" />
          <div className="h-14 w-48 bg-ink-700/60 rounded animate-pulse mb-7" />
          <div className="h-3 w-72 bg-ink-700 rounded animate-pulse mb-2" />
          <div className="h-3 w-56 bg-ink-700 rounded animate-pulse mb-10" />
          <div className="w-16 h-px bg-gold/50" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-wrap gap-3 mb-10 pb-4 border-b border-ink-600">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-9 w-36 bg-ink-700 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[3/4] bg-ink-700 rounded-xl" />
              <div className="pt-3.5 space-y-2 flex flex-col items-center">
                <div className="h-2.5 bg-gold/10 rounded w-1/3" />
                <div className="h-3.5 bg-ink-700 rounded w-3/4" />
                <div className="h-4 bg-ink-700 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
