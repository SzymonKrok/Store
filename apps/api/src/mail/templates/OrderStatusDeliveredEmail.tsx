import { Heading, Link, Section, Text } from '@react-email/components'
import { EmailLayout } from './EmailLayout'
import { shared } from './emailStyles'

export interface OrderStatusDeliveredEmailProps {
  orderId: string
  storefrontUrl: string
}

export function OrderStatusDeliveredEmail({ orderId, storefrontUrl }: OrderStatusDeliveredEmailProps) {
  const shortId = orderId.slice(-8).toUpperCase()

  return (
    <EmailLayout
      preview={`Zamówienie #${shortId} dostarczone — ciesz się zakupem!`}
      storefrontUrl={storefrontUrl}
    >
      <Section style={shared.mainSection}>
        <Heading style={shared.heading}>Przesyłka dotarła!</Heading>
        <Text style={shared.bodyText}>
          Zamówienie{' '}
          <span style={shared.orderId}>#{shortId}</span>{' '}
          zostało pomyślnie dostarczone.
        </Text>
        <Text style={shared.bodyText}>
          Mamy nadzieję, że produkty spełniły Twoje oczekiwania i cieszysz się
          z nowego wyposażenia kuchni. Naturalne drewno z czasem nabiera jeszcze
          piękniejszego charakteru — właśnie takie rzeczy tworzymy.
        </Text>
        <Text style={{ ...shared.bodyText, marginBottom: '24px' }}>
          Masz pytania lub uwagi dotyczące zamówienia? Chętnie pomożemy.
        </Text>

        <Link href={`${storefrontUrl}/sklep`} style={shared.ctaButton}>
          Wróć do sklepu →
        </Link>
      </Section>
    </EmailLayout>
  )
}

export default OrderStatusDeliveredEmail
