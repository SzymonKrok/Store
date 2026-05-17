'use client'

import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useAdminUser, useToggleUserRole, useDeleteUser } from '@/lib/api/users'
import { STATUS_LABELS } from '@/components/orders/order-utils'

interface Props {
  userId: string | null
  onClose: () => void
}

export function UserSheet({ userId, onClose }: Props) {
  const { data: user, isLoading } = useAdminUser(userId ?? '')
  const { mutateAsync: toggleRole, isPending: isTogglingRole } = useToggleUserRole()
  const { mutateAsync: deleteUser, isPending: isDeleting } = useDeleteUser()

  async function handleToggleRole() {
    try {
      await toggleRole(userId!)
      toast.success('Rola zaktualizowana')
    } catch {
      toast.error('Błąd podczas zmiany roli')
    }
  }

  async function handleDeleteUser() {
    try {
      await deleteUser(userId!)
      toast.success('Konto usunięte')
      onClose()
    } catch {
      toast.error('Błąd podczas usuwania konta')
    }
  }

  return (
    <Sheet open={!!userId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[480px] sm:w-[480px] overflow-y-auto">
        {isLoading || !user ? (
          <div className="space-y-4 mt-6">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <div className="space-y-6">
            <SheetHeader>
              <SheetTitle className="text-base">{user.email}</SheetTitle>
              <div className="flex gap-2 items-center">
                <Badge className={user.role === 'ADMIN' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-700'}>
                  {user.role}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Dołączył {format(parseISO(user.createdAt), 'd MMM yyyy', { locale: pl })}
                </span>
              </div>
            </SheetHeader>

            {user.orders && user.orders.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-medium mb-3">Ostatnie zamówienia</h3>
                  <div className="space-y-2">
                    {user.orders.map((order) => (
                      <div key={order.id} className="flex justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {STATUS_LABELS[order.status] ?? order.status}
                          </Badge>
                        </div>
                        <span className="font-medium">{Number(order.total).toLocaleString('pl-PL')} zł</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Separator />

            <div className="space-y-3">
              <h3 className="text-sm font-medium">Akcje</h3>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleToggleRole}
                disabled={isTogglingRole}
              >
                {isTogglingRole
                  ? 'Zmiana roli...'
                  : user.role === 'ADMIN'
                    ? 'Degraduj do USER'
                    : 'Awansuj na ADMIN'}
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full" disabled={isDeleting}>
                    Usuń konto (RODO)
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Usuń konto użytkownika</AlertDialogTitle>
                    <AlertDialogDescription>
                      Ta operacja jest nieodwracalna. Historia zamówień zostanie zachowana, ale dane osobowe użytkownika zostaną usunięte.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Anuluj</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteUser}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Usuń konto
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
