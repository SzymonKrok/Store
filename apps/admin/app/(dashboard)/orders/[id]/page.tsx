'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  Package,
  Building2,
  MapPin,
  Phone,
  Mail,
  User,
  Hash,
  Clock,
  CreditCard,
  Truck,
  Receipt,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  useAdminOrder,
  useUpdateOrderStatus,
  useRegenerateInvoice,
  useGenerateLabel,
} from '@/lib/api/orders'
import { ORDER_STATUSES, STATUS_LABELS, STATUS_COLORS, isActionable } from '@/components/orders/order-utils'

function dt(iso: string) {
  return format(parseISO(iso), 'dd.MM.yyyy, HH:mm', { locale: pl })
}

function fmt(amount: string | number) {
  return Number(amount).toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' zł'
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5">
      <h2 className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest mb-4">{title}</h2>
      {children}
    </div>
  )
}

function MetaRow({ icon: Icon, label, value }: { icon?: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      {Icon && <Icon size={14} className="text-stone-400 mt-0.5 shrink-0" strokeWidth={1.5} />}
      <div className="flex-1 flex justify-between items-start gap-4 min-w-0">
        <span className="text-stone-500 shrink-0">{label}</span>
        <span className="text-stone-800 text-right break-all">{value ?? '—'}</span>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-24 ml-auto" />
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: order, isLoading } = useAdminOrder(id)
  const { mutateAsync: updateStatus, isPending: isUpdatingStatus } = useUpdateOrderStatus()
  const { mutateAsync: regenerateInvoice, isPending: isRegenerating } = useRegenerateInvoice()
  const { mutateAsync: generateLabel, isPending: isGeneratingLabel } = useGenerateLabel()

  const [pendingStatus, setPendingStatus] = useState<string | null>(null)
  const [parcelSize, setParcelSize] = useState('A')
  const [parcelWeight, setParcelWeight] = useState('1')

  async function handleStatusSave() {
    if (!pendingStatus || !order) return
    try {
      await updateStatus({ id: order.id, status: pendingStatus })
      setPendingStatus(null)
      toast.success('Status zamówienia zaktualizowany')
    } catch {
      toast.error('Błąd podczas aktualizacji statusu')
    }
  }

  async function handleRegenerateInvoice() {
    try {
      await regenerateInvoice(id)
      toast.success('Faktura wygenerowana')
    } catch {
      toast.error('Błąd generowania faktury')
    }
  }

  async function handleGenerateLabel() {
    try {
      await generateLabel({ id, parcelSize, parcelWeight: Number(parcelWeight) })
      toast.success('Etykieta wygenerowana')
    } catch {
      toast.error('Błąd generowania etykiety')
    }
  }

  if (isLoading || !order) {
    return (
      <div className="min-h-screen bg-stone-50 p-6 lg:p-8">
        <LoadingSkeleton />
      </div>
    )
  }

  const actionable = isActionable(order.status)
  const currentStatus = pendingStatus ?? order.status
  const hasDiscount = Number(order.discountAmount) > 0
  const customerName = order.user
    ? [order.user.firstName, order.user.lastName].filter(Boolean).join(' ') || null
    : order.guestName
  const customerEmail = order.user?.email ?? order.guestEmail
  const customerPhone = order.user?.phone ?? order.guestPhone
  const shortId = order.id.slice(-8).toUpperCase()

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6">

        {/* Page header */}
        <div className="flex flex-wrap items-start gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/orders')}
            className="text-stone-500 hover:text-stone-800 -ml-2"
          >
            <ArrowLeft size={16} className="mr-1.5" strokeWidth={1.5} />
            Zamówienia
          </Button>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-semibold text-stone-900 font-mono tracking-tight">
                #{shortId}
              </h1>
              <Badge className={`text-xs px-2.5 py-0.5 ${STATUS_COLORS[order.status] ?? ''}`}>
                {STATUS_LABELS[order.status] ?? order.status}
              </Badge>
              {order.wantsInvoice && (
                <Badge className="text-xs px-2.5 py-0.5 bg-blue-50 text-blue-700 border-blue-200">
                  Faktura VAT
                </Badge>
              )}
            </div>
            <p className="text-sm text-stone-400 mt-1 flex items-center gap-1.5">
              <Clock size={12} strokeWidth={1.5} />
              Złożone {dt(order.createdAt)}
            </p>
          </div>

          <div className="text-right">
            <p className="text-2xl font-semibold text-stone-900">{fmt(order.total)}</p>
            {hasDiscount && (
              <p className="text-xs text-stone-400 mt-0.5">
                po rabacie <span className="text-green-700">−{fmt(order.discountAmount)}</span>
              </p>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 items-start">

          {/* ── Left column ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Customer details */}
            <SectionCard title="Klient">
              <div className="space-y-3">
                <MetaRow
                  icon={User}
                  label="Imię i nazwisko"
                  value={
                    <span className="flex items-center gap-2 justify-end">
                      {customerName ?? '—'}
                      {order.userId ? (
                        <Badge className="bg-green-50 text-green-700 border border-green-200 text-[10px] font-medium">Konto</Badge>
                      ) : (
                        <Badge className="bg-stone-100 text-stone-500 border border-stone-200 text-[10px] font-medium">Gość</Badge>
                      )}
                    </span>
                  }
                />
                <MetaRow icon={Mail} label="E-mail" value={customerEmail} />
                <MetaRow icon={Phone} label="Telefon" value={customerPhone} />
                <Separator className="bg-stone-100" />
                <MetaRow
                  icon={MapPin}
                  label="Adres dostawy"
                  value={
                    <span>
                      {order.shippingAddress.street && <>{order.shippingAddress.street}<br /></>}
                      {order.shippingAddress.postalCode} {order.shippingAddress.city}
                    </span>
                  }
                />
                <MetaRow
                  icon={Truck}
                  label="Metoda dostawy"
                  value={order.deliveryMethod === 'COURIER' ? 'Kurier' : 'Paczkomat InPost'}
                />
                {order.deliveryMethod === 'PARCEL_LOCKER' && (
                  <MetaRow
                    icon={MapPin}
                    label="Paczkomat"
                    value={
                      <span className="text-right">
                        {order.lockerCode && (
                          <span className="font-mono font-medium text-stone-900">{order.lockerCode}</span>
                        )}
                        {order.shippingPointDetails?.addressLine1 && (
                          <><br /><span className="font-normal text-stone-600">{order.shippingPointDetails.addressLine1}</span></>
                        )}
                        {order.shippingPointDetails?.addressLine2 && (
                          <><br /><span className="font-normal text-stone-500">{order.shippingPointDetails.addressLine2}</span></>
                        )}
                      </span>
                    }
                  />
                )}
                {order.trackingNumber && (
                  <MetaRow icon={Hash} label="Numer śledzenia" value={
                    <span className="font-mono text-xs">{order.trackingNumber}</span>
                  } />
                )}
              </div>

              {/* Billing address — shown only when it differs from shipping */}
              {order.billingAddress && order.billingAddress.street !== order.shippingAddress.street && (
                <>
                  <Separator className="bg-stone-100 my-4" />
                  <div className="space-y-3">
                    <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest flex items-center gap-2">
                      Adres rozliczeniowy
                      {order.billingAddress.accountType === 'COMPANY' && (
                        <span className="bg-blue-50 text-blue-700 border border-blue-200 rounded px-1.5 py-0.5 text-[10px] font-medium tracking-normal normal-case">Firma</span>
                      )}
                    </p>
                    {order.billingAddress.accountType === 'COMPANY' && (
                      <>
                        <MetaRow icon={Building2} label="Firma" value={order.billingAddress.companyName} />
                        <MetaRow icon={Hash} label="NIP" value={order.billingAddress.nip} />
                      </>
                    )}
                    <MetaRow
                      icon={Receipt}
                      label="Adres"
                      value={
                        <span>
                          {order.billingAddress.firstName} {order.billingAddress.lastName}<br />
                          {order.billingAddress.street}<br />
                          {order.billingAddress.postalCode} {order.billingAddress.city}
                        </span>
                      }
                    />
                  </div>
                </>
              )}

              {order.wantsInvoice && (
                <>
                  <Separator className="bg-stone-100 my-4" />
                  <div className="space-y-3">
                    <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest">Dane do faktury</p>
                    <MetaRow icon={Building2} label="Firma" value={order.companyName} />
                    <MetaRow icon={Hash} label="NIP" value={order.taxId} />
                  </div>
                </>
              )}
            </SectionCard>

            {/* Order items */}
            <SectionCard title="Produkty">
              <div className="space-y-0">
                {/* Table header */}
                <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] gap-x-4 pb-2 border-b border-stone-100 text-[11px] font-medium text-stone-400 uppercase tracking-wide">
                  <span>Produkt</span>
                  <span className="text-right">Ilość</span>
                  <span className="text-right">Cena jedn.</span>
                  <span className="text-right">Razem</span>
                </div>

                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="grid sm:grid-cols-[1fr_auto_auto_auto] gap-x-4 gap-y-1 py-3 border-b border-stone-50 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-stone-800 truncate">{item.productName}</p>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        <span className="font-mono text-[11px] text-stone-400">{item.variantSku}</span>
                        {Object.entries(item.variantAttributes).map(([k, v]) => (
                          <Badge
                            key={k}
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 font-normal text-stone-500 border-stone-200"
                          >
                            {k}: {v}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <span className="text-sm text-stone-600 text-right self-center">×{item.quantity}</span>
                    <span className="text-sm text-stone-500 text-right self-center font-mono">
                      {fmt(item.priceAtPurchase)}
                    </span>
                    <span className="text-sm font-semibold text-stone-900 text-right self-center font-mono">
                      {fmt(Number(item.priceAtPurchase) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="pt-3 mt-1 border-t border-stone-100 space-y-2">
                {hasDiscount && (
                  <>
                    <div className="flex justify-between text-sm text-stone-500">
                      <span>Suma pośrednia</span>
                      <span className="font-mono">{fmt(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-700">
                      <span>
                        Rabat
                        {order.coupon && (
                          <span className="ml-2 font-mono text-xs bg-green-50 border border-green-200 rounded px-1.5 py-0.5">
                            {order.coupon.code}
                          </span>
                        )}
                      </span>
                      <span className="font-mono">−{fmt(order.discountAmount)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between text-base font-semibold text-stone-900 pt-1">
                  <span>Do zapłaty</span>
                  <span className="font-mono">{fmt(order.total)}</span>
                </div>
              </div>
            </SectionCard>

          </div>

          {/* ── Right column ── */}
          <div className="space-y-4">

            {/* Status */}
            <SectionCard title="Status zamówienia">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs px-2.5 py-1 ${STATUS_COLORS[order.status] ?? ''}`}>
                    {STATUS_LABELS[order.status] ?? order.status}
                  </Badge>
                  {pendingStatus && pendingStatus !== order.status && (
                    <span className="text-xs text-stone-400">→ {STATUS_LABELS[pendingStatus]}</span>
                  )}
                </div>
                <Select value={currentStatus} onValueChange={setPendingStatus}>
                  <SelectTrigger className="border-stone-200 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  className="w-full bg-stone-900 hover:bg-stone-800 text-white text-xs"
                  onClick={handleStatusSave}
                  disabled={!pendingStatus || pendingStatus === order.status || isUpdatingStatus}
                >
                  {isUpdatingStatus ? 'Zapisywanie…' : 'Zapisz status'}
                </Button>
              </div>
            </SectionCard>

            {/* Invoice */}
            <SectionCard title="Faktura">
              {order.invoiceUrl ? (
                <Button variant="outline" size="sm" className="w-full border-stone-200 text-stone-700" asChild>
                  <a href={order.invoiceUrl} target="_blank" rel="noreferrer">
                    <FileText size={14} className="mr-2" strokeWidth={1.5} />
                    Pobierz fakturę PDF
                    <ExternalLink size={11} className="ml-auto" strokeWidth={1.5} />
                  </a>
                </Button>
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="block">
                        <Button
                          size="sm"
                          className="w-full bg-stone-900 hover:bg-stone-800 text-white text-xs"
                          onClick={handleRegenerateInvoice}
                          disabled={!actionable || isRegenerating}
                        >
                          <FileText size={13} className="mr-2" strokeWidth={1.5} />
                          {isRegenerating ? 'Generowanie…' : 'Generuj fakturę'}
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {!actionable && (
                      <TooltipContent>
                        Niedostępne dla statusu: {STATUS_LABELS[order.status]}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              )}
              {order.invoiceUrl && (
                <p className="text-[11px] text-stone-400 mt-2 text-center">
                  Wygenerowana automatycznie po płatności
                </p>
              )}
            </SectionCard>

            {/* Shipping label */}
            <SectionCard title="Etykieta InPost">
              {order.shippingLabelUrl ? (
                <Button variant="outline" size="sm" className="w-full border-stone-200 text-stone-700" asChild>
                  <a href={order.shippingLabelUrl} target="_blank" rel="noreferrer">
                    <Package size={14} className="mr-2" strokeWidth={1.5} />
                    Pobierz etykietę
                    <ExternalLink size={11} className="ml-auto" strokeWidth={1.5} />
                  </a>
                </Button>
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="space-y-2.5">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-[11px] text-stone-400">Rozmiar</Label>
                            <Select value={parcelSize} onValueChange={setParcelSize} disabled={!actionable}>
                              <SelectTrigger className="text-xs border-stone-200">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {['A', 'B', 'C'].map((s) => (
                                  <SelectItem key={s} value={s}>Rozmiar {s}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[11px] text-stone-400">Waga (kg)</Label>
                            <Input
                              type="number"
                              value={parcelWeight}
                              onChange={(e) => setParcelWeight(e.target.value)}
                              className="text-xs border-stone-200"
                              disabled={!actionable}
                              min="0.1"
                              step="0.1"
                            />
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="w-full bg-stone-900 hover:bg-stone-800 text-white text-xs"
                          onClick={handleGenerateLabel}
                          disabled={!actionable || isGeneratingLabel}
                        >
                          <Package size={13} className="mr-2" strokeWidth={1.5} />
                          {isGeneratingLabel ? 'Generowanie…' : 'Generuj etykietę'}
                        </Button>
                      </div>
                    </TooltipTrigger>
                    {!actionable && (
                      <TooltipContent>
                        Niedostępne dla statusu: {STATUS_LABELS[order.status]}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              )}
            </SectionCard>

            {/* Technical metadata */}
            <SectionCard title="Szczegóły techniczne">
              <div className="space-y-3">
                <MetaRow icon={Clock} label="Złożone" value={dt(order.createdAt)} />
                <MetaRow icon={Clock} label="Zaktualizowane" value={dt(order.updatedAt)} />
                {order.stripeSessionId && (
                  <>
                    <Separator className="bg-stone-100" />
                    <MetaRow
                      icon={CreditCard}
                      label="Stripe Session"
                      value={
                        <span className="font-mono text-[11px] text-stone-400 break-all">
                          {order.stripeSessionId}
                        </span>
                      }
                    />
                  </>
                )}
              </div>
            </SectionCard>

          </div>
        </div>
      </div>
    </div>
  )
}
