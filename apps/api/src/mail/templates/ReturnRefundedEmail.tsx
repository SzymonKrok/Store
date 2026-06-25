import { Heading, Link, Section, Text } from '@react-email/components'
import { EmailLayout } from './EmailLayout'
import { shared, c } from './emailStyles'

export interface ReturnRefundedEmailProps {
  orderId: string
  amount: number
  storefrontUrl: string
}

export function ReturnRefundedEmail({ orderId, amount, storefrontUrl }: ReturnRefundedEmailProps) {
  const shortId = orderId.slice(-8).toUpperCase()

  return (
    <EmailLayout
      preview={`Zwrot środków za zamówienie #${shortId}`}
      storefrontUrl={storefrontUrl}
    >
      <Section style={shared.mainSection}>
        <Heading style={shared.heading}>Środki zwrócone</Heading>
        <Text style={shared.bodyText}>
          Zrealizowaliśmy zwrot środków za zamówienie{' '}
          <span style={shared.orderId}>#{shortId}</span>.
        </Text>

        <Section style={s.amountBox}>
          <Text style={s.amountLabel}>Kwota zwrotu</Text>
          <Text style={s.amountValue}>{amount.toFixed(2)} zł</Text>
        </Section>

        <Text style={{ ...shared.bodyText, marginBottom: '24px' }}>
          Środki wróciły na metodę płatności użytą przy zakupie. W zależności od
          banku zaksięgowanie może potrwać do kilku dni roboczych.
        </Text>

        <Link href={`${storefrontUrl}/sklep`} style={shared.ctaButton}>
          Wróć do sklepu →
        </Link>
      </Section>
    </EmailLayout>
  )
}

export default ReturnRefundedEmail

const s = {
  amountBox: {
    backgroundColor: c.successBg,
    border: `1px solid ${c.successBorder}`,
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '24px',
    textAlign: 'center' as const,
  },
  amountLabel: {
    fontSize: '11px' as const,
    fontWeight: '600' as const,
    color: c.mutedText,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.6px',
    margin: '0 0 4px',
  },
  amountValue: {
    fontSize: '28px' as const,
    fontWeight: '600' as const,
    color: c.greenPositive,
    margin: '0',
  },
} as const
