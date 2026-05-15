export default function ShopLoading() {
  return (
    <main className="min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="h-9 w-24 bg-stone-200 rounded animate-pulse mb-8" />
        <div className="flex flex-wrap gap-3 mb-8">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-10 w-36 bg-stone-200 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden border border-stone-200 animate-pulse">
              <div className="aspect-square bg-stone-100" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-stone-100 rounded w-3/4" />
                <div className="h-5 bg-stone-100 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
