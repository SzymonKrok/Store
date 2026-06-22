import type { ReactNode } from 'react'
import { Body, Container, Head, Hr, Html, Img, Link, Preview, Section, Text } from '@react-email/components'
import { c } from './emailStyles'

interface EmailLayoutProps {
  preview: string
  storefrontUrl: string
  children: ReactNode
}

export function EmailLayout({ preview, storefrontUrl, children }: EmailLayoutProps) {
  return (
    <Html lang="pl">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={s.body}>
        <Container style={s.container}>

          <Section style={s.accentBar} />

          <Section style={s.header}>
            <Link href={storefrontUrl}>
              <Img
                src={`${storefrontUrl}/logo.png`}
                alt="Lune Atelier"
                width="120"
                height="120"
                style={s.logo}
              />
            </Link>
            <Text style={s.brandTagline}>Fashion for Women</Text>
          </Section>

          <Hr style={s.divider} />

          {children}

          <Hr style={s.divider} />

          <Section style={s.footer}>
            <Text style={s.footerText}>© 2026 Lune Atelier. Wszelkie prawa zastrzeżone.</Text>
            <Text style={s.footerText}>
              Pytania?{' '}
              <Link href={`${storefrontUrl}/kontakt`} style={s.footerLink}>
                Skontaktuj się z nami
              </Link>
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}

const s = {
  body: {
    backgroundColor: c.stoneBg,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    margin: '0',
    padding: '40px 0',
  },
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    backgroundColor: c.white,
    borderRadius: '12px',
    overflow: 'hidden' as const,
    border: `1px solid ${c.border}`,
  },
  accentBar: {
    backgroundColor: c.accentGreen,
    height: '4px',
    width: '100%',
  },
  header: {
    padding: '28px 40px 20px',
    textAlign: 'center' as const,
  },
  logo: {
    display: 'block',
    margin: '0 auto 4px',
  },
  brandTagline: {
    fontSize: '12px',
    color: c.mutedText,
    margin: '0',
    letterSpacing: '0.4px',
    textTransform: 'uppercase' as const,
  },
  divider: {
    borderTop: `1px solid ${c.border}`,
    margin: '0',
  },
  footer: {
    padding: '20px 40px 28px',
    backgroundColor: c.stoneBg,
  },
  footerText: {
    fontSize: '12px',
    color: c.mutedText,
    margin: '0 0 4px',
    lineHeight: '1.6',
  },
  footerLink: {
    color: c.secondaryText,
    textDecoration: 'underline' as const,
  },
} as const
