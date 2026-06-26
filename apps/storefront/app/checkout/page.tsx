import { CheckoutClient } from './CheckoutClient'
import { fetchStoreSettingsServer } from '@/lib/api/settings'

export default async function CheckoutPage() {
  const settings = await fetchStoreSettingsServer()
  return (
    <CheckoutClient
      enableGuestCheckout={settings.enableGuestCheckout}
      shippingCourierCost={parseFloat(settings.shippingCourierCost)}
      shippingLockerCost={parseFloat(settings.shippingLockerCost)}
      freeShipping={settings.freeShipping}
      freeShippingThreshold={settings.freeShippingThreshold ? parseFloat(settings.freeShippingThreshold) : 0}
    />
  )
}
