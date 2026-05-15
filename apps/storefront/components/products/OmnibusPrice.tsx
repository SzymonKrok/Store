interface OmnibusPriceProps {
  currentPrice: number
  omnibusPrice: number | null | undefined
}

export function OmnibusPrice({ currentPrice, omnibusPrice }: OmnibusPriceProps) {
  if (!omnibusPrice || omnibusPrice >= currentPrice) return null

  return (
    <p className="text-zinc-500 text-xs mt-1">
      Najniższa cena z ostatnich 30 dni:{' '}
      <span className="text-zinc-400">{omnibusPrice.toFixed(2)} zł</span>
    </p>
  )
}
