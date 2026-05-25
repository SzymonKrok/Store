'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'
import { ExternalLink, FileText, Package } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useAdminOrder, useUpdateOrderStatus, useRegenerateInvoice, useGenerateLabel } from '@/lib/api/orders'
import { ORDER_STATUSES, STATUS_LABELS, isActionable } from './order-utils'

interface Props {
  orderId: string | null
  onClose: () => void
}

export function OrderSheet({ orderId, onClose }: Props) {
  const { data: order, isLoading } = useAdminOrder(orderId ?? '')
  const { mutateAsync: updateStatus } = useUpdateOrderStatus()
  const { mutateAsync: regenerateInvoice, isPending: isRegenerating } = useRegenerateInvoice()
  const { mutateAsync: generateLabel, isPending: isGeneratingLabel } = useGenerateLabel()

  const [parcelSize, setParcelSize] = useState('A')
  const [parcelWeight, setParcelWeight] = useState('1')

  async function handleStatusChange(status: string) {
    try {
      await updateStatus({ id: orderId!, status })
      toast.success('Status zamówienia zaktualizowany')
    } catch {
      toast.error('Błąd podczas aktualizacji statusu')
    }
  }

  async function handleRegenerateInvoice() {
    try {
      await regenerateInvoice(orderId!)
      toast.success('Faktura wygenerowana')
    } catch {
      toast.error('Błąd generowania faktury')
    }
  }

  async function handleGenerateLabel() {
    try {
      await generateLabel({ id: orderId!, parcelSize, parcelWeight: Number(parcelWeight) })
      toast.success('Etykieta wygenerowana')
    } catch {
      toast.error('Błąd generowania etykiety')
    }
  }

  const actionable = order ? isActionable(order.status) : false

  return (
    <Sheet open={!!orderId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[600px] sm:w-[600px] overflow-y-auto">
        {isLoading || !order ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            Ładowanie...
          </div>
        ) : (
          <div className="space-y-6">
            <SheetHeader>
              <SheetTitle className="font-mono text-sm text-muted-foreground">
                #{order.id.slice(0, 8).toUpperCase()}
              </SheetTitle>
              <p className="text-xs text-muted-foreground">
                {format(parseISO(order.createdAt), 'd MMM yyyy, HH:mm', { locale: pl })}
              </p>
            </SheetHeader>

            {/* Items */}
            <div>
              <h3 className="text-sm font-medium mb-3">Produkty</h3>
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div>
                      <span className="font-medium">{item.productName}</span>
                      <span className="text-muted-foreground ml-1 font-mono text-xs">
                        {item.variantSku}
                      </span>
                      {Object.entries(item.variantAttributes).map(([k, v]) => (
                        <Badge key={k} variant="outline" className="ml-1 text-xs">
                          {k}: {v}
                        </Badge>
                      ))}
                      <span className="text-muted-foreground ml-1">×{item.quantity}</span>
                    </div>
                    <span className="font-medium text-right shrink-0">
                      {(Number(item.priceAtPurchase) * item.quantity).toLocaleString('pl-PL')} zł
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t text-sm flex justify-between font-semibold">
                <span>Razem</span>
                <span>{Number(order.total).toLocaleString('pl-PL')} zł</span>
              </div>
            </div>

            <Separator />

            {/* Shipping & payment */}
            <div>
              <h3 className="text-sm font-medium mb-3">Dostawa i płatność</h3>
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <p className="flex items-center gap-2 flex-wrap">
                  <span className="text-slate-700 font-medium">Klient: </span>
                  {order.user?.email ?? order.guestEmail ?? '—'}
                  {order.userId ? (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs">Konto</Badge>
                  ) : (
                    <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 text-xs">Gość</Badge>
                  )}
                </p>
                <p>
                  <span className="text-slate-700 font-medium">Adres: </span>
                  {order.shippingAddress.street}, {order.shippingAddress.postalCode}{' '}
                  {order.shippingAddress.city}
                </p>
                <p>
                  <span className="text-slate-700 font-medium">Metoda: </span>
                  <Badge variant="outline">
                    {order.deliveryMethod === 'COURIER' ? 'Kurier' : 'Paczkomat'}
                  </Badge>
                  {order.lockerCode && (
                    <span className="ml-2 font-mono text-xs">{order.lockerCode}</span>
                  )}
                </p>
                {order.stripeSessionId && (
                  <p>
                    <span className="text-slate-700 font-medium">Stripe: </span>
                    <span className="font-mono text-xs truncate block max-w-xs">{order.stripeSessionId}</span>
                  </p>
                )}
                {order.wantsInvoice && (
                  <p>
                    <span className="text-slate-700 font-medium">Faktura: </span>
                    {order.companyName} · NIP {order.taxId}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Actions */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Akcje</h3>

              {/* Status */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Select value={order.status} onValueChange={handleStatusChange}>
                  <SelectTrigger>
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
              </div>

              {/* Invoice */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Faktura</Label>
                {order.invoiceUrl ? (
                  <Button variant="outline" size="sm" asChild>
                    <a href={order.invoiceUrl} target="_blank" rel="noreferrer">
                      <FileText size={14} className="mr-2" />
                      Pobierz fakturę
                      <ExternalLink size={12} className="ml-2" />
                    </a>
                  </Button>
                ) : (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button
                            size="sm"
                            onClick={handleRegenerateInvoice}
                            disabled={!actionable || isRegenerating}
                          >
                            {isRegenerating ? 'Generowanie...' : 'Generuj fakturę'}
                          </Button>
                        </span>
                      </TooltipTrigger>
                      {!actionable && (
                        <TooltipContent>
                          Akcja niedostępna dla zamówień w statusie {STATUS_LABELS[order.status]}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>

              {/* Shipping label */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Etykieta InPost</Label>
                {order.shippingLabelUrl ? (
                  <Button variant="outline" size="sm" asChild>
                    <a href={order.shippingLabelUrl} target="_blank" rel="noreferrer">
                      <Package size={14} className="mr-2" />
                      Pobierz etykietę
                      <ExternalLink size={12} className="ml-2" />
                    </a>
                  </Button>
                ) : (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Select value={parcelSize} onValueChange={setParcelSize} disabled={!actionable}>
                              <SelectTrigger className="w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {['A', 'B', 'C'].map((s) => (
                                  <SelectItem key={s} value={s}>
                                    Rozmiar {s}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              type="number"
                              placeholder="Waga (kg)"
                              value={parcelWeight}
                              onChange={(e) => setParcelWeight(e.target.value)}
                              className="w-28"
                              disabled={!actionable}
                              min="0.1"
                              step="0.1"
                            />
                          </div>
                          <Button
                            size="sm"
                            onClick={handleGenerateLabel}
                            disabled={!actionable || isGeneratingLabel}
                          >
                            {isGeneratingLabel ? 'Generowanie...' : 'Generuj etykietę InPost'}
                          </Button>
                        </div>
                      </TooltipTrigger>
                      {!actionable && (
                        <TooltipContent>
                          Akcja niedostępna dla zamówień w statusie {STATUS_LABELS[order.status]}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
