'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { User, ArrowRight } from 'lucide-react'
import { useCart } from '../../lib/api/cart'
import { useCreateOrder } from '../../lib/api/orders'
import { CouponInput } from '../../components/cart/CouponInput'
import { CartSummary } from '../../components/cart/CartSummary'
import { shippingAddressSchema } from '@store/validation'
import { useAuth } from '../../lib/auth'

const checkoutFormSchema = z
  .object({
    firstName: z.string().min(1, 'Imię jest wymagane'),
    lastName: z.string().min(1, 'Nazwisko jest wymagane'),
    email: z.string().email('Nieprawidłowy adres email'),
    streetName: z.string().optional(),
    houseNumber: z.string().optional(),
    apartmentNumber: z.string().optional(),
    city: z.string().optional(),
    postalCode: z.string().optional(),
    phone: z.string().min(9, 'Numer telefonu jest wymagany'),
    acceptTerms: z.literal(true, { errorMap: () => ({ message: 'Musisz zaakceptować regulamin' }) }),
    deliveryMethod: z.enum(['COURIER', 'PARCEL_LOCKER']),
    lockerCode: z.string().optional(),
    wantsInvoice: z.boolean().default(false),
    companyName: z.string().optional(),
    taxId: z.string().optional(),
    billingDifferent: z.boolean().default(false),
    billingAccountType: z.enum(['PRIVATE', 'COMPANY']).default('PRIVATE'),
    billingFirstName: z.string().optional(),
    billingLastName: z.string().optional(),
    billingStreet: z.string().optional(),
    billingCity: z.string().optional(),
    billingPostalCode: z.string().optional(),
    billingCompanyName: z.string().optional(),
    billingNip: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.deliveryMethod === 'COURIER') {
      if (!data.streetName) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Ulica / miejscowość jest wymagana', path: ['streetName'] })
      if (!data.houseNumber) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Numer domu jest wymagany', path: ['houseNumber'] })
      if (!data.city) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Miasto jest wymagane', path: ['city'] })
      if (!data.postalCode || !/^\d{2}-\d{3}$/.test(data.postalCode)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Format: 00-000', path: ['postalCode'] })
      }
    }
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
    if (data.billingDifferent) {
      if (!data.billingFirstName) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Imię jest wymagane', path: ['billingFirstName'] })
      if (!data.billingLastName) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Nazwisko jest wymagane', path: ['billingLastName'] })
      if (!data.billingStreet) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Ulica jest wymagana', path: ['billingStreet'] })
      if (!data.billingCity) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Miasto jest wymagane', path: ['billingCity'] })
      if (!data.billingPostalCode || !/^\d{2}-\d{3}$/.test(data.billingPostalCode)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Format: 00-000', path: ['billingPostalCode'] })
      }
      if (data.billingAccountType === 'COMPANY') {
        if (!data.billingCompanyName) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Nazwa firmy jest wymagana', path: ['billingCompanyName'] })
        if (!data.billingNip || !/^\d{10}$/.test(data.billingNip)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'NIP musi zawierać 10 cyfr', path: ['billingNip'] })
        }
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

export function CheckoutClient({
  enableGuestCheckout = true,
  shippingCourierCost = 14.99,
  shippingLockerCost = 9.99,
  freeShipping = false,
  freeShippingThreshold = 0,
}: {
  enableGuestCheckout?: boolean
  shippingCourierCost?: number
  shippingLockerCost?: number
  freeShipping?: boolean
  freeShippingThreshold?: number
}) {
  const { user, isLoading: authLoading, refreshProfile } = useAuth()
  const { data: cart, isLoading: cartLoading } = useCart()
  const { mutateAsync: createOrder, isPending } = useCreateOrder()
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number } | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [guestChosen, setGuestChosen] = useState(false)
  const [selectedLocker, setSelectedLocker] = useState<{
    name: string; addressLine1: string; addressLine2: string
  } | null>(null)
  const [widgetState, setWidgetState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const geowidgetContainerRef = useRef<HTMLDivElement>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      deliveryMethod: 'COURIER',
      wantsInvoice: false,
      billingDifferent: false,
      billingAccountType: 'PRIVATE' as const,
      email: user?.email ?? '',
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      phone: user?.phone ?? '',
      streetName: '',
      houseNumber: '',
      apartmentNumber: '',
      city: user?.defaultAddress?.city ?? '',
      postalCode: user?.defaultAddress?.postalCode ?? '',
    },
  })

  const deliveryMethod = watch('deliveryMethod')
  const wantsInvoice = watch('wantsInvoice')
  const billingDifferent = watch('billingDifferent')
  const billingAccountType = watch('billingAccountType')

  useEffect(() => {
    if (user?.email) setValue('email', user.email)
  }, [user?.email, setValue])

  // Register global callback once — called by geowidget when a point is selected
  const onPointSelected = useCallback((point: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    name?: string; point_name?: string; address?: { line1?: string; line2?: string }
  }) => {
    const id = point.name ?? point.point_name ?? ''
    setValue('lockerCode', id, { shouldValidate: true })
    setSelectedLocker({
      name: id,
      addressLine1: point.address?.line1 ?? '',
      addressLine2: point.address?.line2 ?? '',
    })
  }, [setValue])

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).inpostPointSelected = onPointSelected
    return () => { delete (window as any).inpostPointSelected }
  }, [onPointSelected])

  // Load/init geowidget when PARCEL_LOCKER is selected; clear locker when switching away
  useEffect(() => {
    if (deliveryMethod !== 'PARCEL_LOCKER') {
      setValue('lockerCode', undefined)
      setSelectedLocker(null)
      setWidgetState('idle')
      return
    }

    const token = process.env.NEXT_PUBLIC_INPOST_GEOWIDGET_TOKEN ?? ''
    if (!token) {
      console.error('[InPost] NEXT_PUBLIC_INPOST_GEOWIDGET_TOKEN is not set — widget cannot load')
      setWidgetState('error')
      return
    }

    function initWidget() {
      if (!geowidgetContainerRef.current) return
      console.log('[InPost] initWidget — container:', geowidgetContainerRef.current, 'token prefix:', token.slice(0, 20))
      geowidgetContainerRef.current.innerHTML =
        `<inpost-geowidget token="${token}" language="pl" config="parcelcollect" onpoint="inpostPointSelected" style="display:block;width:100%;height:100%;"></inpost-geowidget>`
      setWidgetState('ready')
      // Leaflet captures the map viewport size at init time; dispatch resize so it recalculates
      requestAnimationFrame(() => window.dispatchEvent(new Event('resize')))
    }

    if (!document.getElementById('inpost-geowidget-css')) {
      const link = document.createElement('link')
      link.id = 'inpost-geowidget-css'
      link.rel = 'stylesheet'
      link.href = 'https://sandbox-easy-geowidget-sdk.easypack24.net/inpost-geowidget.css'
      document.head.appendChild(link)
    }

    // Use customElements.get() — not getElementById — to know if the script has actually executed
    if (customElements.get('inpost-geowidget')) {
      console.log('[InPost] Custom element already registered — calling initWidget directly')
      initWidget()
      return
    }

    setWidgetState('loading')

    const existingScript = document.getElementById('inpost-geowidget-script')
    if (existingScript) {
      // Script element is in the DOM but hasn't finished executing yet — wait for it
      console.log('[InPost] Script element found but custom element not yet registered — waiting for load event')
      existingScript.addEventListener('load', initWidget, { once: true })
      existingScript.addEventListener('error', () => setWidgetState('error'), { once: true })
      return
    }

    const script = document.createElement('script')
    script.id = 'inpost-geowidget-script'
    script.src = 'https://sandbox-easy-geowidget-sdk.easypack24.net/inpost-geowidget.js'
    script.async = true
    script.onload = initWidget
    script.onerror = () => {
      console.error('[InPost] Failed to load geowidget script from', script.src)
      setWidgetState('error')
    }
    document.head.appendChild(script)
  }, [deliveryMethod, setValue])

  const items = cart?.items ?? []
  const subtotal = items.reduce((sum, i) => sum + parseFloat(i.variant.price) * i.quantity, 0)

  // Shipping cost — mirrors the backend's resolveShippingCost (backend is authoritative).
  const thresholdMet = freeShippingThreshold > 0 && subtotal >= freeShippingThreshold
  const shippingFree = freeShipping || thresholdMet
  const formatCost = (cost: number) =>
    shippingFree || cost === 0 ? 'Gratis' : `${cost.toFixed(2).replace('.', ',')} zł`
  const deliveryOptions = [
    { value: 'COURIER' as const, label: 'InPost Kurier', description: 'Dostawa 1–2 dni robocze', price: formatCost(shippingCourierCost) },
    { value: 'PARCEL_LOCKER' as const, label: 'Paczkomat InPost', description: 'Odbiór w ciągu 24h', price: formatCost(shippingLockerCost) },
  ]
  const shippingCost = shippingFree
    ? 0
    : deliveryMethod === 'PARCEL_LOCKER'
      ? shippingLockerCost
      : shippingCourierCost

  async function onSubmit(values: CheckoutFormValues) {
    setServerError(null)
    try {
      const { acceptTerms: _, ...rest } = values
      const { paymentUrl } = await createOrder({
        shippingAddress: {
          firstName: rest.firstName,
          lastName: rest.lastName,
          email: user?.email ?? rest.email,
          street: rest.streetName
            ? `${rest.streetName} ${rest.houseNumber ?? ''}${rest.apartmentNumber ? `/${rest.apartmentNumber}` : ''}`.trim()
            : '',
          city: rest.city ?? '',
          postalCode: rest.postalCode ?? '',
          phone: rest.phone,
        },
        billingAddress: rest.billingDifferent ? {
          accountType: rest.billingAccountType,
          firstName: rest.billingFirstName!,
          lastName: rest.billingLastName!,
          street: rest.billingStreet!,
          city: rest.billingCity!,
          postalCode: rest.billingPostalCode!,
          companyName: rest.billingAccountType === 'COMPANY' ? rest.billingCompanyName : undefined,
          nip: rest.billingAccountType === 'COMPANY' ? rest.billingNip : undefined,
        } : undefined,
        couponCode: appliedCoupon?.code,
        deliveryMethod: rest.deliveryMethod,
        lockerCode: rest.lockerCode,
        shippingPointDetails: selectedLocker ?? undefined,
        wantsInvoice: rest.wantsInvoice,
        companyName: rest.companyName,
        taxId: rest.taxId,
      })
      // Refresh profile so next checkout visit is pre-filled (fire-and-forget)
      if (user) refreshProfile().catch(() => {})
      // External redirect to Stripe Checkout hosted page
      window.location.href = paymentUrl
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: unknown } } })?.response?.data?.message
      const errorText = Array.isArray(msg) ? msg.join(', ') : (msg as string) ?? 'Wystąpił błąd. Spróbuj ponownie.'
      setServerError(errorText)
      toast.error(errorText)
    }
  }

  if (cartLoading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-ink-600 border-t-gold rounded-full animate-spin" />
      </div>
    )
  }

  // Gate: prompt unauthenticated users to login or continue as guest (N1)
  if (!user && !guestChosen) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-medium text-cream italic mb-2">Przejdź do kasy</h1>
          <p className="text-cream-muted text-sm">
            {enableGuestCheckout
              ? 'Zaloguj się, aby przyspieszyć zakupy, lub kontynuuj jako gość.'
              : 'Zaloguj się, aby złożyć zamówienie.'}
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/logowanie?redirect=/checkout"
            className="flex items-center justify-between w-full px-5 py-4 bg-gold text-ink rounded-2xl hover:bg-gold-200 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <User size={18} strokeWidth={1.5} />
              <div className="text-left">
                <p className="font-semibold text-sm">Zaloguj się</p>
                <p className="text-ink/70 text-xs mt-0.5">Szybsze zakupy, historia zamówień</p>
              </div>
            </div>
            <ArrowRight size={16} strokeWidth={1.5} className="opacity-60 group-hover:opacity-100 transition-opacity" />
          </Link>

          {enableGuestCheckout && (
            <button
              onClick={() => setGuestChosen(true)}
              className="flex items-center justify-between w-full px-5 py-4 bg-ink-800 border border-ink-600 text-cream/80 rounded-2xl hover:border-gold/50 transition-colors group cursor-pointer"
            >
              <div className="text-left">
                <p className="font-medium text-sm">Kontynuuj jako gość</p>
                <p className="text-cream-muted text-xs mt-0.5">Bez rejestracji, szybka realizacja</p>
              </div>
              <ArrowRight size={16} strokeWidth={1.5} className="opacity-40 group-hover:opacity-70 transition-opacity" />
            </button>
          )}

          <p className="text-center text-xs text-cream-muted pt-1">
            Nie masz konta?{' '}
            <Link href="/rejestracja" className="text-gold underline hover:no-underline">
              Zarejestruj się
            </Link>
          </p>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <p className="text-cream-muted">Twój koszyk jest pusty.</p>
        <Link href="/sklep" className="text-sm font-medium text-gold underline">
          Wróć do sklepu
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-display text-3xl font-medium text-cream mb-8 italic">Zamówienie</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 items-start">
          {/* Shipping form */}
          <div className="bg-ink-800 border border-ink-600 rounded-2xl p-6 space-y-4">
            <h2 className="font-medium text-cream text-lg">Dane dostawy</h2>

            {/* Delivery method toggle */}
            <div>
              <p className="text-sm font-medium text-cream/80 mb-2">Metoda dostawy</p>
              <div className="grid grid-cols-2 gap-3">
                {deliveryOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`flex flex-col gap-1 border rounded-xl p-3.5 cursor-pointer transition-colors ${
                      deliveryMethod === option.value
                        ? 'border-gold bg-gold/10'
                        : 'border-ink-600 hover:border-ink-500'
                    }`}
                  >
                    <input
                      type="radio"
                      value={option.value}
                      {...register('deliveryMethod')}
                      className="sr-only"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-cream">{option.label}</span>
                      <span className="text-sm font-semibold text-gold">{option.price}</span>
                    </div>
                    <span className="text-xs text-cream-muted">{option.description}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* InPost Geowidget */}
            {deliveryMethod === 'PARCEL_LOCKER' && (
              <div className="space-y-2">
                <div className="relative border border-ink-600 rounded-xl" style={{ height: 520 }}>
                  <div ref={geowidgetContainerRef} className="w-full h-full rounded-xl overflow-hidden" />
                  {widgetState === 'loading' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink-850">
                      <div className="w-8 h-8 border-2 border-ink-600 border-t-gold rounded-full animate-spin" />
                      <p className="text-xs text-cream-muted">Ładowanie mapy paczkomatów…</p>
                    </div>
                  )}
                  {widgetState === 'error' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ink-850 px-6 text-center">
                      <p className="text-sm font-medium text-cream">Nie udało się załadować mapy paczkomatów</p>
                      <p className="text-xs text-cream-muted">Odśwież stronę lub spróbuj ponownie za chwilę</p>
                    </div>
                  )}
                </div>
                {watch('lockerCode') ? (
                  <div className="flex items-start gap-2.5 p-3 bg-gold/10 border border-gold/30 rounded-xl">
                    <div className="mt-0.5 w-5 h-5 rounded-full bg-gold flex items-center justify-center shrink-0">
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="#0A0A0A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gold font-mono">{watch('lockerCode')}</p>
                      {selectedLocker?.addressLine1 && (
                        <p className="text-xs text-cream/80 mt-0.5">{selectedLocker.addressLine1}</p>
                      )}
                      {selectedLocker?.addressLine2 && (
                        <p className="text-xs text-cream-muted">{selectedLocker.addressLine2}</p>
                      )}
                    </div>
                  </div>
                ) : errors.lockerCode ? (
                  <p className="text-xs text-red-400">{errors.lockerCode.message}</p>
                ) : null}
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
              {user ? (
                <input
                  value={user.email}
                  type="email"
                  readOnly
                  className="w-full h-10 px-3 text-sm border border-ink-600 rounded-xl bg-ink-850 text-cream-muted cursor-not-allowed"
                />
              ) : (
                <input {...register('email')} type="email" className={inputCls(!!errors.email)} placeholder="jan@example.com" />
              )}
            </Field>

            {deliveryMethod === 'COURIER' && (
              <>
                <Field label="Ulica / miejscowość" error={errors.streetName?.message}>
                  <input
                    {...register('streetName')}
                    className={inputCls(!!errors.streetName)}
                    placeholder="ul. Kwiatowa lub Janowice"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Nr domu" error={errors.houseNumber?.message}>
                    <input
                      {...register('houseNumber')}
                      className={inputCls(!!errors.houseNumber)}
                      placeholder="15 lub 15A"
                    />
                  </Field>
                  <Field label="Nr lokalu (opcjonalnie)" error={errors.apartmentNumber?.message}>
                    <input
                      {...register('apartmentNumber')}
                      className={inputCls(!!errors.apartmentNumber)}
                      placeholder="3 lub 12A"
                    />
                  </Field>
                </div>
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
                  className="w-4 h-4 rounded border-ink-500 bg-ink-700 text-gold focus:ring-gold"
                />
                <span className="text-sm text-cream/80">Chcę fakturę na firmę</span>
              </label>
            </div>

            {wantsInvoice && (
              <div className="space-y-4 pt-1 border-t border-ink-600">
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

            {/* Billing address toggle */}
            <div className="pt-1 border-t border-ink-600">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('billingDifferent')}
                  className="w-4 h-4 rounded border-ink-500 bg-ink-700 text-gold focus:ring-gold"
                />
                <span className="text-sm text-cream/80">Adres rozliczeniowy jest inny niż adres dostawy</span>
              </label>
            </div>

            {billingDifferent && (
              <div className="space-y-4 p-4 bg-ink-850 border border-ink-600 rounded-xl">
                <p className="text-sm font-medium text-cream/80">Adres rozliczeniowy</p>

                {/* Account type toggle */}
                <div className="grid grid-cols-2 gap-3">
                  {(['PRIVATE', 'COMPANY'] as const).map((type) => (
                    <label
                      key={type}
                      className={`flex items-center gap-2 border rounded-xl p-3 cursor-pointer transition-colors bg-ink-800 ${
                        billingAccountType === type
                          ? 'border-gold'
                          : 'border-ink-600 hover:border-ink-500'
                      }`}
                    >
                      <input
                        type="radio"
                        value={type}
                        {...register('billingAccountType')}
                        className="sr-only"
                      />
                      <span className={`text-sm font-medium ${billingAccountType === type ? 'text-gold' : 'text-cream-muted'}`}>
                        {type === 'PRIVATE' ? 'Osoba prywatna' : 'Firma'}
                      </span>
                    </label>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Imię" error={errors.billingFirstName?.message}>
                    <input
                      {...register('billingFirstName')}
                      className={inputCls(!!errors.billingFirstName)}
                      placeholder="Jan"
                    />
                  </Field>
                  <Field label="Nazwisko" error={errors.billingLastName?.message}>
                    <input
                      {...register('billingLastName')}
                      className={inputCls(!!errors.billingLastName)}
                      placeholder="Kowalski"
                    />
                  </Field>
                </div>

                {billingAccountType === 'COMPANY' && (
                  <div className="space-y-4">
                    <Field label="Nazwa firmy" error={errors.billingCompanyName?.message}>
                      <input
                        {...register('billingCompanyName')}
                        className={inputCls(!!errors.billingCompanyName)}
                        placeholder="Firma Sp. z o.o."
                      />
                    </Field>
                    <Field label="NIP" error={errors.billingNip?.message}>
                      <input
                        {...register('billingNip')}
                        className={inputCls(!!errors.billingNip)}
                        placeholder="1234567890"
                        maxLength={10}
                      />
                    </Field>
                  </div>
                )}

                <Field label="Ulica i numer" error={errors.billingStreet?.message}>
                  <input
                    {...register('billingStreet')}
                    className={inputCls(!!errors.billingStreet)}
                    placeholder="ul. Kwiatowa 1"
                  />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Miasto" error={errors.billingCity?.message}>
                    <input
                      {...register('billingCity')}
                      className={inputCls(!!errors.billingCity)}
                      placeholder="Warszawa"
                    />
                  </Field>
                  <Field label="Kod pocztowy" error={errors.billingPostalCode?.message}>
                    <input
                      {...register('billingPostalCode')}
                      className={inputCls(!!errors.billingPostalCode)}
                      placeholder="00-000"
                    />
                  </Field>
                </div>
              </div>
            )}

            {/* T&C checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('acceptTerms')}
                  className="mt-0.5 w-4 h-4 rounded border-ink-500 bg-ink-700 text-gold focus:ring-gold"
                />
                <span className="text-sm text-cream/80 leading-relaxed">
                  Akceptuję{' '}
                  <Link href="/regulamin" className="underline hover:text-gold">Regulamin</Link>
                  {' '}i{' '}
                  <Link href="/polityka-prywatnosci" className="underline hover:text-gold">Politykę prywatności</Link>
                </span>
              </label>
              {errors.acceptTerms && (
                <p className="text-xs text-red-400 mt-1">{errors.acceptTerms.message}</p>
              )}
            </div>

            {serverError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">
                {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3.5 bg-gold text-ink font-semibold rounded-2xl hover:bg-gold-200 transition-colors disabled:opacity-60 cursor-pointer"
            >
              {isPending ? 'Przekierowuję do płatności...' : 'Przejdź do płatności'}
            </button>
          </div>

          {/* Order summary */}
          <div className="bg-ink-800 border border-ink-600 rounded-2xl p-6 space-y-4 lg:sticky lg:top-24">
            <h2 className="font-medium text-cream text-lg">Podsumowanie</h2>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {items.map((item) => {
                const attrs = Object.entries(item.variant.attributes)
                return (
                  <div key={item.id} className="flex justify-between gap-2 text-sm text-cream/80">
                    <div className="min-w-0 flex-1">
                      <span className="truncate block">
                        {item.variant.product.name}{' '}
                        <span className="text-cream-muted">×{item.quantity}</span>
                      </span>
                      {attrs.length > 0 && (
                        <span className="text-xs text-cream-muted">
                          {attrs.map(([k, v]) => `${k}: ${v}`).join(', ')}
                        </span>
                      )}
                    </div>
                    <span className="flex-shrink-0 font-medium text-cream">
                      {(parseFloat(item.variant.price) * item.quantity).toFixed(2)} zł
                    </span>
                  </div>
                )
              })}
            </div>

            <div className="border-t border-ink-600 pt-4 space-y-3">
              <CouponInput
                subtotal={subtotal}
                onApply={setAppliedCoupon}
                appliedCode={appliedCoupon?.code}
              />
              <CartSummary
                subtotal={subtotal}
                discountAmount={appliedCoupon?.discountAmount}
                couponCode={appliedCoupon?.code}
                shippingCost={shippingCost}
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
      <label className="text-sm font-medium text-cream/80">{label}</label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

function inputCls(hasError: boolean) {
  return `w-full h-10 px-3 text-sm border rounded-xl focus:outline-none focus:border-gold bg-ink-700 text-cream placeholder:text-cream-muted/60 transition-colors ${
    hasError ? 'border-red-500/60 focus:border-red-400' : 'border-ink-600'
  }`
}
