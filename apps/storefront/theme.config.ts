export const themeConfig = {
  features: {
    enableBestsellers: true,
    enableGuestCheckout: true,
    enableVariants: true,
    enableCoupons: true,
    enableAbandonedCartRecovery: true,
  },
  ui: {
    mode: 'dark' as const,
    primaryColor: '#0A0A0A',
    accentColor: '#C8A45C',
    fontFamily: 'Inter',
    displayFontFamily: 'Cormorant',
    borderRadius: '1rem',
  },
  store: {
    name: 'Lune Atelier',
    currency: 'PLN',
    locale: 'pl-PL',
  },
  seo: {
    description:
      'Lune Atelier — kobieca moda z duszą. Starannie wyselekcjonowane kolekcje, które podkreślają Twój blask.',
    // Profile social media — używane w schemacie Organization (Google "sameAs").
    social: [
      'https://www.instagram.com/sylwia71188',
      'https://www.facebook.com/profile.php?id=61589968093699',
    ],
  },
} as const

export type ThemeConfig = typeof themeConfig
