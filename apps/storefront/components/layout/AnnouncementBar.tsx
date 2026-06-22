const messages = [
  'Darmowa dostawa od 299 zł',
  '−10% na pierwsze zakupy z kodem LUNE10',
  'Wysyłka w 24h • Zwroty do 30 dni',
]

export function AnnouncementBar() {
  return (
    <div className="bg-gold text-ink">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-9 items-center justify-center gap-8 overflow-hidden">
          {messages.map((msg, i) => (
            <p
              key={msg}
              className={`text-[0.7rem] font-semibold uppercase tracking-[0.18em] whitespace-nowrap ${
                i === 1 ? '' : 'hidden sm:block'
              }`}
            >
              {msg}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}
