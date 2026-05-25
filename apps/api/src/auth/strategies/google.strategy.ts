import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy, type VerifyCallback, type Profile } from 'passport-google-oauth20'
import { ConfigService } from '@nestjs/config'
import { UsersService } from '../../users/users.service'

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly usersService: UsersService,
    configService: ConfigService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') || 'google-not-configured',
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') || 'google-not-configured',
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL') || 'http://localhost:4000/api/auth/google/callback',
      scope: ['profile', 'email'],
    })
  }

  async validate(_accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback) {
    const email = profile.emails?.[0]?.value
    if (!email) return done(new Error('No email from Google'), undefined)

    let user = await this.usersService.findByGoogleId(profile.id)

    if (!user) {
      user = await this.usersService.findByEmail(email)
      if (user) {
        user = await this.usersService.linkGoogleId(user.id, profile.id)
      } else {
        user = await this.usersService.createGoogleUser({
          email,
          googleId: profile.id,
          firstName: profile.name?.givenName,
          lastName: profile.name?.familyName,
        })
      }
    }

    done(null, { id: user.id, email: user.email, role: user.role })
  }
}
