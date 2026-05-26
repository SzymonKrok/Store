import { Heading, Link, Section, Text } from '@react-email/components'
import { EmailLayout } from './EmailLayout'
import { shared, c } from './emailStyles'

export interface AbandonedCartEmailProps {
  items: Array<{ name: string; quantity: number }>
  storefrontUrl: string
}

export function AbandonedCartEmail({ items, storefrontUrl }: AbandonedCartEmailProps) {
  return (
    <EmailLayout
      preview="Masz produkty czekające w koszyku"
      storefrontUrl={storefrontUrl}
    >
      <Section style={shared.mainSection}>
        <Heading style={shared.heading}>Coś zostało w koszyku…</Heading>
        <Text style={shared.bodyText}>
          Zostawiłeś produkty w koszyku. Wróć i dokończ zamówienie — czekają na Ciebie.
        </Text>

        <Section style={s.itemList}>
          {items.map((item, i) => (
            <Text key={i} style={s.itemRow}>
              <span style={s.itemDot}>·</span>{' '}
              <span style={s.itemName}>{item.name}</span>
              <span style={s.itemQty}> × {item.quantity}</span>
            </Text>
          ))}
        </Section>

        <Text style={{ ...shared.bodyText, marginBottom: '24px' }}>
          Nie czekaj za długo — ilości w magazynie są ograniczone.
        </Text>

        <Link href={`${storefrontUrl}/koszyk`} style={shared.ctaButton}>
          Wróć do koszyka →
        </Link>
      </Section>
    </EmailLayout>
  )
}

export default AbandonedCartEmail

const s = {
  itemList: {
    backgroundColor: '#fafaf9',
    borderRadius: '8px',
    border: `1px solid ${c.border}`,
    padding: '8px 16px',
    marginBottom: '24px',
  },
  itemRow: {
    fontSize: '14px' as const,
    color: c.primaryText,
    margin: '6px 0',
    lineHeight: '1.5',
  },
  itemDot: {
    color: c.accentGreen,
    fontWeight: '700' as const,
  },
  itemName: {
    color: c.primaryText,
  },
  itemQty: {
    color: c.secondaryText,
  },
} as const
