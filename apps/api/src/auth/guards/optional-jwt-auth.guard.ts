import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleRequest(err: any, user: any, info: any, context: ExecutionContext): any {
    // If a Bearer token was supplied but is invalid/expired, surface a 401
    // so the client's silent-refresh interceptor can rotate the token. Without
    // this, a logged-in user with an expired access token silently creates a
    // guest order — confusing UX (see GuestConversionBanner on their own order).
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined> }>()
    const authHeader = request.headers.authorization
    if (authHeader && (err || info)) {
      throw err ?? new UnauthorizedException(info?.message ?? 'Invalid or expired token')
    }
    return user ?? null
  }
}
