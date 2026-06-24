import { ImageResponse } from 'next/og'

// Apple touch icon — monogram „LA" (ekran główny iOS / zakładki).
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0A0A0A',
          color: '#C8A45C',
          fontSize: 100,
          fontWeight: 600,
          letterSpacing: 2,
        }}
      >
        LA
      </div>
    ),
    size,
  )
}
