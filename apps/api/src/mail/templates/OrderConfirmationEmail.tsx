import { Column, Hr, Link, Heading, Row, Section, Text } from '@react-email/components'
import { EmailLayout } from './EmailLayout'
import { shared } from './emailStyles'

export interface OrderConfirmationEmailProps {
  orderId: string
  items: Array<{ name: string; sku: string; quantity: number; priceGross: number }>
  total: number
  discountAmount: number
  shippingCost: number
  storefrontUrl: string
  hasPdfAttachment: boolean
}

export function OrderConfirmationEmail({
  orderId,
  items,
  total,
  discountAmount,
  shippingCost,
  storefrontUrl,
  hasPdfAttachment,
}: OrderConfirmationEmailProps) {
  const shortId = orderId.slice(-8).toUpperCase()

  return (
    <EmailLayout
      preview={`Zamówienie #${shortId} potwierdzone — dziękujemy!`}
      storefrontUrl={storefrontUrl}
    >
      <Section style={shared.mainSection}>
        <Heading style={shared.heading}>Dziękujemy za zamówienie!</Heading>
        <Text style={shared.bodyText}>
          Zamówienie{' '}
          <span style={shared.orderId}>#{shortId}</span>{' '}
          zostało przyjęte i oczekuje na realizację.
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

        {hasPdfAttachment && (
          <Section style={s.invoiceNote}>
            <Text style={s.invoiceNoteText}>
              📎 Faktura VAT (PDF) jest dołączona do tej wiadomości.
            </Text>
          </Section>
        )}

        <Section style={{ marginTop: '8px' }}>
          <Link href={`${storefrontUrl}/sklep`} style={shared.ctaButton}>
            Kontynuuj zakupy →
          </Link>
        </Section>
      </Section>
    </EmailLayout>
  )
}

export default OrderConfirmationEmail

const s = {
  table: {
    backgroundColor: '#fafaf9',
    borderRadius: '8px',
    border: '1px solid #e7e5e4',
    padding: '0 16px',
    marginBottom: '24px',
  },
  invoiceNote: {
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '8px',
    padding: '0 16px',
    marginBottom: '24px',
  },
  invoiceNoteText: {
    fontSize: '13px' as const,
    color: '#166534',
    margin: '0',
    padding: '12px 0',
    lineHeight: '1.5',
  },
} as const
