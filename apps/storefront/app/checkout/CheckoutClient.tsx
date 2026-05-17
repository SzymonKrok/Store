'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCart } from '../../lib/api/cart'
import { useCreateOrder } from '../../lib/api/orders'
import { CouponInput } from '../../components/cart/CouponInput'
import { CartSummary } from '../../components/cart/CartSummary'
import { shippingAddressSchema } from '@store/validation'

const checkoutFormSchema = z
  .object({
    firstName: z.string().min(1, 'Imię jest wymagane'),
    lastName: z.string().min(1, 'Nazwisko jest wymagane'),
    email: z.string().email('Nieprawidłowy adres email'),
    street: z.string().min(1, 'Ulica jest wymagana'),
    city: z.string().min(1, 'Miasto jest wymagane'),
    postalCode: z.string().regex(/^\d{2}-\d{3}$/, 'Format: 00-000'),
    phone: z.string().min(9, 'Numer telefonu jest wymagany'),
    acceptTerms: z.literal(true, { errorMap: () => ({ message: 'Musisz zaakceptować regulamin' }) }),
    deliveryMethod: z.enum(['COURIER', 'PARCEL_LOCKER']),
    lockerCode: z.string().optional(),
    wantsInvoice: z.boolean().default(false),
    companyName: z.string().optional(),
    taxId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.deliveryMethod === 'PARCEL_LOCKER' && !data.lockerCode) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Wybierz paczkomat', path: ['lockerCode'] })
    }
    if (data.wantsInvoice) {
      if (!data.companyName) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Nazwa firmy jest wymagana', path: ['companyName'] })
      }
      if (!data.taxId || !/^\d{10}$/.test(data.taxId)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'NIP musi zawierać 10 cyfr', path: ['taxId'] })
      }
    }
  })

type CheckoutFormValues = z.infer<typeof checkoutFormSchema>

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    InPostGeowidget?: any
  }
}

export function CheckoutClient() {
  const { data: cart, isLoading: cartLoading } = useCart()
  const { mutateAsync: createOrder, isPending } = useCreateOrder()
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number } | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const geowidgetContainerRef = useRef<HTMLDivElement>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: { deliveryMethod: 'COURIER', wantsInvoice: false },
  })

  const deliveryMethod = watch('deliveryMethod')
  const wantsInvoice = watch('wantsInvoice')

  // Lazy-load InPost Geowidget script when parcel locker selected
  useEffect(() => {
    if (deliveryMethod !== 'PARCEL_LOCKER') return
    if (document.getElementById('inpost-geowidget-script')) return

    const script = document.createElement('script')
    script.id = 'inpost-geowidget-script'
    script.src = 'https://geowidget.inpost.pl/inpost-geowidget.js'
    script.defer = true
    script.onload = () => {
      if (geowidgetContainerRef.current) {
        const token = process.env.NEXT_PUBLIC_INPOST_GEOWIDGET_TOKEN ?? ''
        geowidgetContainerRef.current.innerHTML =
          `<inpost-geowidget token="${token}" language="pl" onpoint="inpostPointSelected"></inpost-geowidget>`
      }
    }
    document.head.appendChild(script)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).inpostPointSelected = (point: { point_name: string }) => {
      setValue('lockerCode', point.point_name, { shouldValidate: true })
    }
  }, [deliveryMethod, setValue])

  const items = cart?.items ?? []
  const subtotal = items.reduce((sum, i) => sum + parseFloat(i.variant.price) * i.quantity, 0)

  async function onSubmit(values: CheckoutFormValues) {
    setServerError(null)
    try {
      const { acceptTerms: _, ...rest } = values
      const { paymentUrl } = await createOrder({
        shippingAddress: {
          firstName: rest.firstName,
          lastName: rest.lastName,
          email: rest.email,
          street: rest.street,
          city: rest.city,
          postalCode: rest.postalCode,
          phone: rest.phone,
        },
        couponCode: appliedCoupon?.code,
        deliveryMethod: rest.deliveryMethod,
        lockerCode: rest.lockerCode,
        wantsInvoice: rest.wantsInvoice,
        companyName: rest.companyName,
        taxId: rest.taxId,
      })
      // External redirect to Stripe Checkout hosted page
      window.location.href = paymentUrl
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: unknown } } })?.response?.data?.message
      if (Array.isArray(msg)) {
        setServerError(msg.join(', '))
      } else {
        setServerError((msg as string) ?? 'Wystąpił błąd. Spróbuj ponownie.')
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

            {/* Delivery method toggle */}
            <div>
              <p className="text-sm font-medium text-stone-700 mb-2">Metoda dostawy</p>
              <div className="grid grid-cols-2 gap-3">
                {(['COURIER', 'PARCEL_LOCKER'] as const).map((method) => (
                  <label
                    key={method}
                    className={`flex items-center gap-2 border rounded-xl p-3 cursor-pointer transition-colors ${
                      deliveryMethod === method
                        ? 'border-stone-900 bg-stone-50'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <input
                      type="radio"
                      value={method}
                      {...register('deliveryMethod')}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium text-stone-900">
                      {method === 'COURIER' ? 'Kurier' : 'Paczkomat InPost'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* InPost Geowidget */}
            {deliveryMethod === 'PARCEL_LOCKER' && (
              <div>
                <div ref={geowidgetContainerRef} className="min-h-[400px] border border-stone-200 rounded-xl overflow-hidden" />
                {watch('lockerCode') && (
                  <p className="text-sm text-green-700 mt-1">
                    Wybrany paczkomat: <span className="font-medium">{watch('lockerCode')}</span>
                  </p>
                )}
                {errors.lockerCode && (
                  <p className="text-xs text-red-500 mt-1">{errors.lockerCode.message}</p>
                )}
              </div>
            )}

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

            {deliveryMethod === 'COURIER' && (
              <>
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
              </>
            )}

            <Field label="Telefon" error={errors.phone?.message}>
              <input {...register('phone')} type="tel" className={inputCls(!!errors.phone)} placeholder="123 456 789" />
            </Field>

            {/* Invoice checkbox */}
            <div className="pt-1">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('wantsInvoice')}
                  className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-500"
                />
                <span className="text-sm text-stone-600">Chcę fakturę na firmę</span>
              </label>
            </div>

            {wantsInvoice && (
              <div className="space-y-4 pt-1 border-t border-stone-100">
                <Field label="Nazwa firmy" error={errors.companyName?.message}>
                  <input
                    {...register('companyName')}
                    className={inputCls(!!errors.companyName)}
                    placeholder="Firma Sp. z o.o."
                  />
                </Field>
                <Field label="NIP" error={errors.taxId?.message}>
                  <input
                    {...register('taxId')}
                    className={inputCls(!!errors.taxId)}
                    placeholder="1234567890"
                    maxLength={10}
                  />
                </Field>
              </div>
            )}

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
              {isPending ? 'Przekierowuję do płatności...' : 'Przejdź do płatności'}
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
