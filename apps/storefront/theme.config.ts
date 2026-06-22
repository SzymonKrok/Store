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
} as const

export type ThemeConfig = typeof themeConfig
