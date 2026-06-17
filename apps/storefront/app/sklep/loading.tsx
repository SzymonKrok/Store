export default function ShopLoading() {
  return (
    <main className="min-h-screen bg-stone-50">
      <div className="relative overflow-hidden bg-stone-900">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-900/30 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/3 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-px bg-amber-700" />
            <div className="h-2.5 w-20 bg-stone-700 rounded animate-pulse" />
          </div>
          <div className="h-14 w-72 bg-stone-800 rounded animate-pulse mb-2" />
          <div className="h-14 w-48 bg-stone-800/60 rounded animate-pulse mb-7" />
          <div className="h-3 w-72 bg-stone-800 rounded animate-pulse mb-2" />
          <div className="h-3 w-56 bg-stone-800 rounded animate-pulse mb-10" />
          <div className="w-16 h-px bg-amber-900" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-wrap gap-3 mb-10 pb-4 border-b border-stone-200">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-9 w-36 bg-stone-200 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden border border-stone-200 animate-pulse">
              <div className="aspect-square bg-stone-100" />
              <div className="p-4 space-y-2.5">
                <div className="h-2.5 bg-amber-50 rounded w-1/4" />
                <div className="h-3.5 bg-stone-100 rounded w-3/4" />
                <div className="h-5 bg-stone-100 rounded w-1/3 mt-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
