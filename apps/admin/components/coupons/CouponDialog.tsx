'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import type { AdminCoupon } from '@/lib/api/coupons'

const schema = z.object({
  code: z.string().min(1, 'Kod jest wymagany'),
  type: z.enum(['PERCENTAGE', 'FLAT']),
  value: z.string().min(1, 'Wartość jest wymagana'),
  expiresAt: z.string().optional(),
  minOrderValue: z.string().optional(),
  maxUses: z.string().optional(),
  limitPerUser: z.string().optional(),
  isActive: z.boolean(),
})
type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  coupon?: AdminCoupon | null
  onSubmit: (payload: unknown) => Promise<void>
}

export function CouponDialog({ open, onClose, coupon, onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'PERCENTAGE', isActive: true },
  })

  useEffect(() => {
    if (coupon) {
      reset({
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : '',
        minOrderValue: coupon.minOrderValue ?? '',
        maxUses: coupon.maxUses != null ? String(coupon.maxUses) : '',
        limitPerUser: coupon.limitPerUser != null ? String(coupon.limitPerUser) : '',
        isActive: coupon.isActive,
      })
    } else {
      reset({ code: '', type: 'PERCENTAGE', value: '', isActive: true })
    }
  }, [coupon, reset])

  async function handleFormSubmit(values: FormValues) {
    await onSubmit({
      code: values.code.toUpperCase(),
      type: values.type,
      value: Number(values.value),
      expiresAt: values.expiresAt || null,
      minOrderValue: values.minOrderValue ? Number(values.minOrderValue) : null,
      maxUses: values.maxUses ? Number(values.maxUses) : null,
      limitPerUser: values.limitPerUser ? Number(values.limitPerUser) : null,
      isActive: values.isActive,
    })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{coupon ? 'Edytuj kupon' : 'Nowy kupon'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-3 mt-2">
          <div className="space-y-1.5">
            <Label>Kod</Label>
            <Input {...register('code')} className="font-mono uppercase" placeholder="LATO20" />
            {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Typ</Label>
              <Select
                value={watch('type')}
                onValueChange={(v) => setValue('type', v as 'PERCENTAGE' | 'FLAT')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">Procentowy</SelectItem>
                  <SelectItem value="FLAT">Kwotowy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Wartość</Label>
              <Input type="number" step="0.01" min="0" {...register('value')} />
              {errors.value && <p className="text-xs text-destructive">{errors.value.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Wygasa (opcjonalnie)</Label>
            <Input type="date" {...register('expiresAt')} />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Min. kwota</Label>
              <Input type="number" min="0" placeholder="—" {...register('minOrderValue')} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Maks. użyć</Label>
              <Input type="number" min="1" placeholder="∞" {...register('maxUses')} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Limit/os.</Label>
              <Input type="number" min="1" placeholder="∞" {...register('limitPerUser')} />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Switch
              checked={watch('isActive')}
              onCheckedChange={(v) => setValue('isActive', v)}
              id="isActive"
            />
            <Label htmlFor="isActive">Aktywny</Label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Anuluj</Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Zapisywanie...' : 'Zapisz'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
