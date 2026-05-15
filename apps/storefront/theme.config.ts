export const themeConfig = {
  features: {
    enableBestsellers: true,
    enableGuestCheckout: true,
    enableVariants: true,
    enableCoupons: true,
    enableAbandonedCartRecovery: true,
  },
  ui: {
    mode: 'light' as const,
    primaryColor: '#1C1917',
    accentColor: '#A16207',
    fontFamily: 'Inter',
    displayFontFamily: 'Cormorant',
    borderRadius: '1rem',
  },
  store: {
    name: 'Store',
    currency: 'PLN',
    locale: 'pl-PL',
  },
} as const

export type ThemeConfig = typeof themeConfig
