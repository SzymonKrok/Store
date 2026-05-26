import { Heading, Link, Section, Text } from '@react-email/components'
import { EmailLayout } from './EmailLayout'
import { shared } from './emailStyles'

export interface WelcomeEmailProps {
  firstName?: string | null
  variant: 'new' | 'conversion'
  storefrontUrl: string
}

export function WelcomeEmail({ firstName, variant, storefrontUrl }: WelcomeEmailProps) {
  const greeting = firstName ? `Cześć, ${firstName}!` : 'Witaj w Sklepie!'
  const isConversion = variant === 'conversion'

  return (
    <EmailLayout
      preview={isConversion ? 'Twoje konto zostało utworzone' : 'Witaj — cieszmy się, że jesteś!'}
      storefrontUrl={storefrontUrl}
    >
      <Section style={shared.mainSection}>
        <Heading style={shared.heading}>{greeting}</Heading>

        {isConversion ? (
          <>
            <Text style={shared.bodyText}>
              Twoje konto zostało pomyślnie utworzone na podstawie danych z zamówienia.
              Możesz teraz śledzić wszystkie swoje zamówienia i zarządzać kontem w jednym miejscu.
            </Text>
            <Link href={`${storefrontUrl}/konto/zamowienia`} style={shared.ctaButton}>
              Zobacz moje zamówienia →
            </Link>
          </>
        ) : (
          <>
            <Text style={shared.bodyText}>
              Twoje konto zostało pomyślnie założone. Cieszymy się, że wybrałeś nasze produkty
              z naturalnego drewna — rzemiosło i jakość, które czuć na co dzień.
            </Text>
            <Text style={{ ...shared.bodyText, marginBottom: '24px' }}>
              Przejrzyj naszą kolekcję i znajdź coś wyjątkowego dla swojej kuchni.
            </Text>
            <Link href={`${storefrontUrl}/sklep`} style={shared.ctaButton}>
              Przejdź do sklepu →
            </Link>
          </>
        )}
      </Section>
    </EmailLayout>
  )
}

export default WelcomeEmail
