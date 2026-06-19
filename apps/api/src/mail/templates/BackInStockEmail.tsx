import { Heading, Link, Section, Text } from '@react-email/components'
import { EmailLayout } from './EmailLayout'
import { shared } from './emailStyles'

export interface BackInStockEmailProps {
  productName: string
  variantLabel?: string | null
  productUrl: string
  storefrontUrl: string
}

export function BackInStockEmail({
  productName,
  variantLabel,
  productUrl,
  storefrontUrl,
}: BackInStockEmailProps) {
  return (
    <EmailLayout preview={`${productName} jest znów dostępny`} storefrontUrl={storefrontUrl}>
      <Section style={shared.mainSection}>
        <Heading style={shared.heading}>Wraca na półki!</Heading>
        <Text style={shared.bodyText}>
          Produkt, o który pytałeś, jest znów dostępny w naszym sklepie:
        </Text>
        <Text style={{ ...shared.bodyText, fontWeight: 600, marginBottom: '4px' }}>
          {productName}
        </Text>
        {variantLabel && (
          <Text style={{ ...shared.bodyText, color: '#78716c', marginTop: 0, marginBottom: '24px' }}>
            {variantLabel}
          </Text>
        )}
        <Text style={shared.bodyText}>
          Zapasy mogą być ograniczone, dlatego nie zwlekaj z zakupem.
        </Text>
        <Link href={productUrl} style={shared.ctaButton}>
          Zobacz produkt →
        </Link>
      </Section>
    </EmailLayout>
  )
}

export default BackInStockEmail
