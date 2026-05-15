'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCart } from '../../lib/api/cart'
import { useCreateOrder } from '../../lib/api/orders'
import { CouponInput } from '../../components/cart/CouponInput'
import { CartSummary } from '../../components/cart/CartSummary'
import { shippingAddressSchema } from '@store/validation'

const checkoutFormSchema = z.object({
  firstName: z.string().min(1, 'Imię jest wymagane'),
  lastName: z.string().min(1, 'Nazwisko jest wymagane'),
  email: z.string().email('Nieprawidłowy adres email'),
  street: z.string().min(1, 'Ulica jest wymagana'),
  city: z.string().min(1, 'Miasto jest wymagane'),
  postalCode: z.string().regex(/^\d{2}-\d{3}$/, 'Format: 00-000'),
  phone: z.string().min(9, 'Numer telefonu jest wymagany'),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: 'Musisz zaakceptować regulamin' }) }),
})

type CheckoutFormValues = z.infer<typeof checkoutFormSchema>

export function CheckoutClient() {
  const router = useRouter()
  const { data: cart, isLoading: cartLoading } = useCart()
  const { mutateAsync: createOrder, isPending } = useCreateOrder()
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number } | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
  })

  const items = cart?.items ?? []
  const subtotal = items.reduce((sum, i) => sum + parseFloat(i.variant.price) * i.quantity, 0)

  async function onSubmit(values: CheckoutFormValues) {
    setServerError(null)
    try {
      const { acceptTerms: _, ...address } = values
      const order = await createOrder({
        shippingAddress: address,
        couponCode: appliedCoupon?.code,
      })
      router.push(`/order-confirmation/${order.id}`)
    } catch (err: any) {
      const msg = err?.response?.data?.message
      if (Array.isArray(msg)) {
        setServerError(msg.join(', '))
      } else {
        setServerError(msg ?? 'Wystąpił błąd. Spróbuj ponownie.')
      }
    }
  }

  if (cartLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-stone-200 border-t-stone-900 rounded-full animate-spin" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <p className="text-stone-500">Twój koszyk jest pusty.</p>
        <Link href="/sklep" className="text-sm font-medium text-stone-900 underline">
          Wróć do sklepu
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-display text-3xl font-medium text-stone-900 mb-8 italic">Zamówienie</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 items-start">
          {/* Shipping form */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
            <h2 className="font-medium text-stone-900 text-lg">Dane dostawy</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Imię" error={errors.firstName?.message}>
                <input {...register('firstName')} className={inputCls(!!errors.firstName)} placeholder="Jan" />
              </Field>
              <Field label="Nazwisko" error={errors.lastName?.message}>
                <input {...register('lastName')} className={inputCls(!!errors.lastName)} placeholder="Kowalski" />
              </Field>
            </div>

            <Field label="Email" error={errors.email?.message}>
              <input {...register('email')} type="email" className={inputCls(!!errors.email)} placeholder="jan@example.com" />
            </Field>

            <Field label="Ulica i numer" error={errors.street?.message}>
              <input {...register('street')} className={inputCls(!!errors.street)} placeholder="ul. Kwiatowa 1" />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Miasto" error={errors.city?.message}>
                <input {...register('city')} className={inputCls(!!errors.city)} placeholder="Warszawa" />
              </Field>
              <Field label="Kod pocztowy" error={errors.postalCode?.message}>
                <input {...register('postalCode')} className={inputCls(!!errors.postalCode)} placeholder="00-000" />
              </Field>
            </div>

            <Field label="Telefon" error={errors.phone?.message}>
              <input {...register('phone')} type="tel" className={inputCls(!!errors.phone)} placeholder="123 456 789" />
            </Field>

            {/* T&C checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('acceptTerms')}
                  value="true"
                  className="mt-0.5 w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-500"
                />
                <span className="text-sm text-stone-600 leading-relaxed">
                  Akceptuję{' '}
                  <Link href="/regulamin" className="underline hover:text-stone-900">Regulamin</Link>
                  {' '}i{' '}
                  <Link href="/polityka-prywatnosci" className="underline hover:text-stone-900">Politykę prywatności</Link>
                </span>
              </label>
              {errors.acceptTerms && (
                <p className="text-xs text-red-500 mt-1">{errors.acceptTerms.message}</p>
              )}
            </div>

            {serverError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3.5 bg-stone-900 text-white font-medium rounded-2xl hover:bg-stone-700 transition-colors disabled:opacity-60 cursor-pointer"
            >
              {isPending ? 'Przetwarzanie...' : 'Złóż zamówienie'}
            </button>
          </div>

          {/* Order summary */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4 lg:sticky lg:top-24">
            <h2 className="font-medium text-stone-900 text-lg">Podsumowanie</h2>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm text-stone-700">
                  <span className="truncate flex-1 pr-2">
                    {item.variant.product.name}{' '}
                    <span className="text-stone-400">×{item.quantity}</span>
                  </span>
                  <span className="flex-shrink-0 font-medium">
                    {(parseFloat(item.variant.price) * item.quantity).toFixed(2)} zł
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-stone-100 pt-4 space-y-3">
              <CouponInput
                subtotal={subtotal}
                onApply={setAppliedCoupon}
                appliedCode={appliedCoupon?.code}
              />
              <CartSummary
                subtotal={subtotal}
                discountAmount={appliedCoupon?.discountAmount}
                couponCode={appliedCoupon?.code}
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-stone-700">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

function inputCls(hasError: boolean) {
  return `w-full h-10 px-3 text-sm border rounded-xl focus:outline-none focus:border-stone-400 bg-white transition-colors ${
    hasError ? 'border-red-300 focus:border-red-400' : 'border-stone-200'
  }`
}
