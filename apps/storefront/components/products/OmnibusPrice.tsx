interface OmnibusPriceProps {
  currentPrice: number
  omnibusPrice: number | null | undefined
}

export function OmnibusPrice({ currentPrice, omnibusPrice }: OmnibusPriceProps) {
  if (!omnibusPrice || omnibusPrice >= currentPrice) return null

  return (
    <p className="text-cream-muted/70 text-xs mt-1">
      Najniższa cena z 30 dni:{' '}
      <span className="text-cream-muted">{omnibusPrice.toFixed(2)} zł</span>
    </p>
  )
}
