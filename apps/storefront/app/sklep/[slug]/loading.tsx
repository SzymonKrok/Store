export default function ProductLoading() {
  return (
    <main className="min-h-screen bg-ink">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex gap-2 mb-10">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-3 w-20 bg-ink-700 rounded animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            <div className="aspect-square bg-ink-700 rounded-3xl animate-pulse" />
            <div className="flex gap-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-20 h-20 bg-ink-700 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
          <div className="space-y-5 pt-2">
            <div className="h-3 w-20 bg-ink-700 rounded animate-pulse" />
            <div className="h-9 w-3/4 bg-ink-700 rounded animate-pulse" />
            <div className="h-8 w-28 bg-ink-700 rounded animate-pulse" />
            <div className="space-y-2 pt-2">
              {[75, 65, 55].map((w, i) => (
                <div key={i} className="h-3 bg-ink-700 rounded animate-pulse" style={{ width: `${w}%` }} />
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              {[0, 1].map((i) => (
                <div key={i} className="h-10 w-16 bg-ink-700 rounded-xl animate-pulse" />
              ))}
            </div>
            <div className="h-12 bg-ink-700 rounded-2xl animate-pulse mt-4" />
          </div>
        </div>
      </div>
    </main>
  )
}
