import { CheckoutClient } from './CheckoutClient'
import { fetchStoreSettingsServer } from '@/lib/api/settings'

export default async function CheckoutPage() {
  const settings = await fetchStoreSettingsServer()
  return <CheckoutClient enableGuestCheckout={settings.enableGuestCheckout} />
}
