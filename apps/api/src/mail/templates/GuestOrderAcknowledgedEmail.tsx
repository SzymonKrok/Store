import { Column, Heading, Hr, Link, Row, Section, Text } from '@react-email/components'
import { EmailLayout } from './EmailLayout'
import { shared } from './emailStyles'

export interface GuestOrderAcknowledgedEmailProps {
  orderId: string
  items: Array<{ name: string; sku: string; quantity: number; priceGross: number }>
  total: number
  discountAmount: number
  shippingCost: number
  storefrontUrl: string
}

export function GuestOrderAcknowledgedEmail({
  orderId,
  items,
  total,
  discountAmount,
  shippingCost,
  storefrontUrl,
}: GuestOrderAcknowledgedEmailProps) {
  const shortId = orderId.slice(-8).toUpperCase()

  return (
    <EmailLayout
      preview={`Zamówienie #${shortId} przyjęte — czeka na płatność`}
      storefrontUrl={storefrontUrl}
    >
      <Section style={shared.mainSection}>
        <Heading style={shared.heading}>Zamówienie przyjęte!</Heading>
        <Text style={shared.bodyText}>
          Numer zamówienia:{' '}
          <span style={shared.orderId}>#{shortId}</span>
        </Text>
        <Text style={{ ...shared.bodyText, marginBottom: '28px' }}>
          Twoje zamówienie zostało przyjęte i oczekuje na potwierdzenie płatności.
          Po jej zaksięgowaniu wyślemy osobną wiadomość z potwierdzeniem i fakturą.
        </Text>

        <Section style={s.table}>
          <Row>
            <Column style={shared.colProduct}><Text style={shared.tableHeaderCell}>Produkt</Text></Column>
            <Column style={shared.colSku}><Text style={shared.tableHeaderCell}>SKU / szt.</Text></Column>
            <Column style={shared.colPrice}><Text style={{ ...shared.tableHeaderCell, textAlign: 'right' }}>Kwota</Text></Column>
          </Row>
          <Hr style={shared.tableHr} />
          {items.map((item, i) => (
            <Row key={i}>
              <Column style={shared.colProduct}><Text style={shared.cellText}>{item.name}</Text></Column>
              <Column style={shared.colSku}><Text style={shared.cellMuted}>{item.sku} × {item.quantity}</Text></Column>
              <Column style={shared.colPrice}><Text style={{ ...shared.cellText, textAlign: 'right' }}>{(item.priceGross * item.quantity).toFixed(2)} zł</Text></Column>
            </Row>
          ))}
          {discountAmount > 0 && (
            <Row>
              <Column style={shared.colProduct}><Text style={shared.discountLabel}>Rabat</Text></Column>
              <Column style={shared.colSku} />
              <Column style={shared.colPrice}><Text style={{ ...shared.discountLabel, textAlign: 'right' }}>−{discountAmount.toFixed(2)} zł</Text></Column>
            </Row>
          )}
          <Row>
            <Column style={shared.colProduct}><Text style={shared.cellText}>Dostawa</Text></Column>
            <Column style={shared.colSku} />
            <Column style={shared.colPrice}><Text style={{ ...shared.cellText, textAlign: 'right' }}>{shippingCost > 0 ? `${shippingCost.toFixed(2)} zł` : 'Gratis'}</Text></Column>
          </Row>
          <Hr style={shared.tableHr} />
          <Row>
            <Column style={shared.colProduct}><Text style={shared.totalLabel}>Razem (brutto)</Text></Column>
            <Column style={shared.colSku} />
            <Column style={shared.colPrice}><Text style={{ ...shared.totalLabel, textAlign: 'right' }}>{total.toFixed(2)} zł</Text></Column>
          </Row>
        </Section>

        <Link href={`${storefrontUrl}/order-confirmation/${orderId}`} style={shared.ctaButton}>
          Śledź zamówienie →
        </Link>
      </Section>
    </EmailLayout>
  )
}

export default GuestOrderAcknowledgedEmail

const s = {
  table: {
    backgroundColor: '#fafaf9',
    borderRadius: '8px',
    border: '1px solid #e7e5e4',
    padding: '0 16px',
    marginBottom: '24px',
  },
} as const
