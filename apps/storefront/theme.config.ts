export const themeConfig = {
  features: {
    enableBestsellers: true,
    enableGuestCheckout: true,
    enableVariants: true,
    enableCoupons: true,
    enableAbandonedCartRecovery: true,
  },
  ui: {
    primaryColor: '#18181b',
    accentColor: '#3b82f6',
    fontFamily: 'Inter',
    borderRadius: '0.5rem',
  },
  store: {
    name: 'Store',
    currency: 'PLN',
    locale: 'pl-PL',
  },
} as const

export type ThemeConfig = typeof themeConfig
