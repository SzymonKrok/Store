import { NextRequest, NextResponse } from 'next/server'

const STAGING_PASSWORD = process.env.STAGING_PASSWORD

export function middleware(request: NextRequest) {
  if (!STAGING_PASSWORD) return NextResponse.next()

  const auth = request.headers.get('authorization')
  if (auth) {
    const [, credentials] = auth.split(' ')
    const decoded = Buffer.from(credentials, 'base64').toString()
    const [, password] = decoded.split(':')
    if (password === STAGING_PASSWORD) return NextResponse.next()
  }

  return new NextResponse('Dostęp chroniony hasłem', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Lune Atelier Staging"' },
  })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
