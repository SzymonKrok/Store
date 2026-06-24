import { ImageResponse } from 'next/og'

// Favicon — monogram „LA" w złocie na czarnym tle.
export const size = { width: 64, height: 64 }
export const contentType = 'image/png'

export default function Icon() {
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
          fontSize: 38,
          fontWeight: 600,
          letterSpacing: 1,
          borderRadius: 12,
        }}
      >
        LA
      </div>
    ),
    size,
  )
}
