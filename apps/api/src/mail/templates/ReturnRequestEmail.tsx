import { Heading, Link, Section, Text } from '@react-email/components'
import { EmailLayout } from './EmailLayout'
import { shared, c } from './emailStyles'

export interface ReturnRequestEmailProps {
  orderId: string
  reason: string
  storefrontUrl: string
}

export function ReturnRequestEmail({ orderId, reason, storefrontUrl }: ReturnRequestEmailProps) {
  const shortId = orderId.slice(-8).toUpperCase()

  return (
    <EmailLayout
      preview={`Wniosek zwrotu dla zamówienia #${shortId} — przyjęty`}
      storefrontUrl={storefrontUrl}
    >
      <Section style={shared.mainSection}>
        <Heading style={shared.heading}>Wniosek zwrotu przyjęty</Heading>
        <Text style={shared.bodyText}>
          Zamówienie{' '}
          <span style={shared.orderId}>#{shortId}</span>
        </Text>
        <Text style={shared.bodyText}>
          Twój wniosek o zwrot został przyjęty do rozpatrzenia.
          Skontaktujemy się z Tobą w ciągu <strong>2 dni roboczych</strong> z dalszymi instrukcjami.
        </Text>

        <Section style={s.reasonBox}>
          <Text style={s.reasonLabel}>Podany powód zwrotu</Text>
          <Text style={s.reasonText}>{reason}</Text>
        </Section>

        <Section style={s.stepsList}>
          <Text style={s.stepsTitle}>Co dalej?</Text>
          <Text style={s.step}>1. Nasz zespół weryfikuje wniosek (do 2 dni roboczych).</Text>
          <Text style={s.step}>2. Otrzymasz e-mail z instrukcją odesłania towaru.</Text>
          <Text style={s.step}>3. Po otrzymaniu zwrotu zrealizujemy refundację na podane konto.</Text>
        </Section>

        <Link href={`${storefrontUrl}/order-confirmation/${orderId}`} style={shared.ctaButton}>
          Szczegóły zamówienia →
        </Link>
      </Section>
    </EmailLayout>
  )
}

export default ReturnRequestEmail

const s = {
  reasonBox: {
    backgroundColor: '#fafaf9',
    border: `1px solid ${c.border}`,
    borderRadius: '8px',
    padding: '0 16px',
    marginBottom: '24px',
  },
  reasonLabel: {
    fontSize: '11px' as const,
    fontWeight: '600' as const,
    color: c.mutedText,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.6px',
    margin: '12px 0 4px',
  },
  reasonText: {
    fontSize: '14px' as const,
    color: c.primaryText,
    margin: '0 0 12px',
    lineHeight: '1.5',
    fontStyle: 'italic' as const,
  },
  stepsList: {
    backgroundColor: '#fafaf9',
    border: `1px solid ${c.border}`,
    borderRadius: '8px',
    padding: '0 16px',
    marginBottom: '24px',
  },
  stepsTitle: {
    fontSize: '13px' as const,
    fontWeight: '600' as const,
    color: c.primaryText,
    margin: '12px 0 8px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.4px',
  },
  step: {
    fontSize: '13px' as const,
    color: c.secondaryText,
    margin: '0 0 6px',
    lineHeight: '1.5',
  },
} as const
