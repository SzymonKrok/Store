import { ImageResponse } from 'next/og'

// Domyślny obrazek udostępniania (Facebook / Messenger / WhatsApp / X).
// Generowany z brandu Lune Atelier — czarne tło, złoty akcent.
export const alt = 'Lune Atelier — Moda damska'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const INK = '#0A0A0A'
const GOLD = '#C8A45C'
const CREAM = '#F5F1E8'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: `radial-gradient(circle at 50% 35%, #1a1a1a 0%, ${INK} 70%)`,
          position: 'relative',
        }}
      >
        {/* Złota ramka */}
        <div
          style={{
            position: 'absolute',
            top: 32,
            left: 32,
            right: 32,
            bottom: 32,
            border: `1px solid ${GOLD}`,
            opacity: 0.5,
          }}
        />

        {/* Eyebrow */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            color: GOLD,
            fontSize: 24,
            letterSpacing: 8,
            textTransform: 'uppercase',
            marginBottom: 28,
          }}
        >
          <span style={{ width: 40, height: 1, background: GOLD }} />
          Fashion for Women
          <span style={{ width: 40, height: 1, background: GOLD }} />
        </div>

        {/* Wordmark */}
        <div
          style={{
            color: CREAM,
            fontSize: 110,
            fontWeight: 600,
            letterSpacing: 6,
            lineHeight: 1,
          }}
        >
          LUNE ATELIER
        </div>

        {/* Tagline */}
        <div
          style={{
            color: '#A8A29E',
            fontSize: 30,
            marginTop: 36,
            maxWidth: 760,
            textAlign: 'center',
          }}
        >
          Kobieca moda, która podkreśla Twój blask
        </div>
      </div>
    ),
    size,
  )
}
