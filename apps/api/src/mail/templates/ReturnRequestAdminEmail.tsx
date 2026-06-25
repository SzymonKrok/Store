import { Heading, Section, Text } from '@react-email/components'
import { EmailLayout } from './EmailLayout'
import { shared, c } from './emailStyles'

export interface ReturnRequestAdminEmailProps {
  orderId: string
  reason: string
  customerEmail: string
  items: Array<{ name: string; sku: string; quantity: number }>
  storefrontUrl: string
}

export function ReturnRequestAdminEmail({
  orderId,
  reason,
  customerEmail,
  items,
  storefrontUrl,
}: ReturnRequestAdminEmailProps) {
  const shortId = orderId.slice(-8).toUpperCase()

  return (
    <EmailLayout
      preview={`Nowy wniosek zwrotu #${shortId}`}
      storefrontUrl={storefrontUrl}
    >
      <Section style={shared.mainSection}>
        <Heading style={shared.heading}>Nowy wniosek zwrotu</Heading>
        <Text style={shared.bodyText}>
          Klient złożył wniosek o zwrot dla zamówienia{' '}
          <span style={shared.orderId}>#{shortId}</span>.
          Rozpatrz go w panelu administracyjnym (zakładka „Zwroty").
        </Text>

        <Section style={s.box}>
          <Text style={s.label}>Klient</Text>
          <Text style={s.value}>{customerEmail}</Text>
          <Text style={s.label}>Powód</Text>
          <Text style={s.valueItalic}>{reason}</Text>
          <Text style={s.label}>Pozycje do zwrotu</Text>
          {items.map((it, i) => (
            <Text key={i} style={s.value}>
              {it.quantity}× {it.name} <span style={s.sku}>({it.sku})</span>
            </Text>
          ))}
        </Section>
      </Section>
    </EmailLayout>
  )
}

export default ReturnRequestAdminEmail

const s = {
  box: {
    backgroundColor: c.stoneBg,
    border: `1px solid ${c.border}`,
    borderRadius: '8px',
    padding: '4px 16px 12px',
    marginBottom: '24px',
  },
  label: {
    fontSize: '11px' as const,
    fontWeight: '600' as const,
    color: c.mutedText,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.6px',
    margin: '12px 0 4px',
  },
  value: {
    fontSize: '14px' as const,
    color: c.primaryText,
    margin: '0 0 2px',
    lineHeight: '1.5',
  },
  valueItalic: {
    fontSize: '14px' as const,
    color: c.primaryText,
    margin: '0 0 2px',
    lineHeight: '1.5',
    fontStyle: 'italic' as const,
  },
  sku: {
    fontFamily: 'monospace',
    fontSize: '12px' as const,
    color: c.mutedText,
  },
} as const
