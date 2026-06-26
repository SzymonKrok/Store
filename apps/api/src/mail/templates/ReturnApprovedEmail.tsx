import { Heading, Link, Section, Text } from '@react-email/components'
import { EmailLayout } from './EmailLayout'
import { shared, c } from './emailStyles'

export interface ReturnApprovedEmailProps {
  orderId: string
  returnAddress: string | null
  storefrontUrl: string
}

export function ReturnApprovedEmail({ orderId, returnAddress, storefrontUrl }: ReturnApprovedEmailProps) {
  const shortId = orderId.slice(-8).toUpperCase()

  return (
    <EmailLayout
      preview={`Zwrot #${shortId} zatwierdzony — odeślij paczkę`}
      storefrontUrl={storefrontUrl}
    >
      <Section style={shared.mainSection}>
        <Heading style={shared.heading}>Zwrot zatwierdzony</Heading>
        <Text style={shared.bodyText}>
          Twój wniosek o zwrot dla zamówienia{' '}
          <span style={shared.orderId}>#{shortId}</span>{' '}
          został zatwierdzony. Prosimy o odesłanie towaru na poniższy adres.
        </Text>

        {returnAddress && (
          <Section style={s.addressBox}>
            <Text style={s.addressLabel}>Adres do odesłania</Text>
            <Text style={s.addressText}>{returnAddress}</Text>
          </Section>
        )}

        <Section style={s.stepsList}>
          <Text style={s.stepsTitle}>Co dalej?</Text>
          <Text style={s.step}>1. Zapakuj produkty bezpiecznie, najlepiej w oryginalnym stanie.</Text>
          <Text style={s.step}>2. Dołącz informację z numerem zamówienia #{shortId}.</Text>
          <Text style={s.step}>3. Po otrzymaniu i sprawdzeniu przesyłki zwrócimy środki na oryginalną metodę płatności.</Text>
        </Section>

        <Link href={`${storefrontUrl}/order-confirmation/${orderId}`} style={shared.ctaButton}>
          Szczegóły zamówienia →
        </Link>
      </Section>
    </EmailLayout>
  )
}

export default ReturnApprovedEmail

const s = {
  addressBox: {
    backgroundColor: c.stoneBg,
    border: `1px solid ${c.border}`,
    borderRadius: '8px',
    padding: '0 16px',
    marginBottom: '24px',
  },
  addressLabel: {
    fontSize: '11px' as const,
    fontWeight: '600' as const,
    color: c.mutedText,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.6px',
    margin: '12px 0 4px',
  },
  addressText: {
    fontSize: '15px' as const,
    color: c.primaryText,
    margin: '0 0 12px',
    lineHeight: '1.6',
    whiteSpace: 'pre-line' as const,
  },
  stepsList: {
    backgroundColor: c.stoneBg,
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
