import { Heading, Link, Section, Text } from '@react-email/components'
import { EmailLayout } from './EmailLayout'
import { shared, c } from './emailStyles'

export interface OrderStatusShippedEmailProps {
  orderId: string
  trackingNumber?: string | null
  storefrontUrl: string
}

export function OrderStatusShippedEmail({
  orderId,
  trackingNumber,
  storefrontUrl,
}: OrderStatusShippedEmailProps) {
  const shortId = orderId.slice(-8).toUpperCase()

  return (
    <EmailLayout
      preview={`Zamówienie #${shortId} zostało wysłane!`}
      storefrontUrl={storefrontUrl}
    >
      <Section style={shared.mainSection}>
        <Heading style={shared.heading}>Twoje zamówienie jest w drodze!</Heading>
        <Text style={shared.bodyText}>
          Zamówienie{' '}
          <span style={shared.orderId}>#{shortId}</span>{' '}
          zostało przekazane do kuriera. Niedługo dotrze do Ciebie.
        </Text>

        {trackingNumber && (
          <Section style={s.trackingBox}>
            <Text style={s.trackingLabel}>Numer śledzenia przesyłki</Text>
            <Text style={s.trackingNumber}>{trackingNumber}</Text>
          </Section>
        )}

        <Text style={{ ...shared.bodyText, marginBottom: '24px' }}>
          Paczka powinna dotrzeć w ciągu 1–3 dni roboczych.
          W razie pytań jesteśmy do Twojej dyspozycji.
        </Text>

        <Link href={`${storefrontUrl}/order-confirmation/${orderId}`} style={shared.ctaButton}>
          Szczegóły zamówienia →
        </Link>
      </Section>
    </EmailLayout>
  )
}

export default OrderStatusShippedEmail

const s = {
  trackingBox: {
    backgroundColor: '#fafaf9',
    border: `1px solid ${c.border}`,
    borderLeft: `3px solid ${c.accentGreen}`,
    borderRadius: '8px',
    padding: '0 16px',
    marginBottom: '24px',
  },
  trackingLabel: {
    fontSize: '11px' as const,
    fontWeight: '600' as const,
    color: c.mutedText,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.6px',
    margin: '12px 0 4px',
  },
  trackingNumber: {
    fontFamily: 'monospace',
    fontSize: '16px' as const,
    fontWeight: '600' as const,
    color: c.primaryText,
    margin: '0 0 12px',
    letterSpacing: '0.5px',
  },
} as const
