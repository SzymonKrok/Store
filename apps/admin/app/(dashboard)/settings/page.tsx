'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Settings, FileText, ToggleLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { useStoreSettings, useUpdateStoreSettings } from '@/lib/api/settings'

type Tab = 'analytics' | 'legal' | 'features'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('analytics')
  const { data: settings, isLoading } = useStoreSettings()
  const { mutateAsync: save, isPending } = useUpdateStoreSettings()

  const [ga4Id, setGa4Id] = useState('')
  const [fbPixelId, setFbPixelId] = useState('')
  const [terms, setTerms] = useState('')
  const [privacy, setPrivacy] = useState('')
  const [showQuantitySelector, setShowQuantitySelector] = useState(true)
  const [showStockBadge, setShowStockBadge] = useState(true)
  const [showReviews, setShowReviews] = useState(true)
  const [showBestsellers, setShowBestsellers] = useState(true)
  const [enableGuestCheckout, setEnableGuestCheckout] = useState(true)

  useEffect(() => {
    if (settings) {
      setGa4Id(settings.ga4Id ?? '')
      setFbPixelId(settings.fbPixelId ?? '')
      setTerms(settings.termsOfService)
      setPrivacy(settings.privacyPolicy)
      setShowQuantitySelector(settings.showQuantitySelector)
      setShowStockBadge(settings.showStockBadge)
      setShowReviews(settings.showReviews)
      setShowBestsellers(settings.showBestsellers)
      setEnableGuestCheckout(settings.enableGuestCheckout)
    }
  }, [settings])

  async function handleSaveAnalytics() {
    try {
      await save({ ga4Id: ga4Id || null, fbPixelId: fbPixelId || null })
      toast.success('Ustawienia analityki zapisane')
    } catch {
      toast.error('Błąd podczas zapisywania')
    }
  }

  async function handleSaveLegal() {
    try {
      await save({ termsOfService: terms, privacyPolicy: privacy })
      toast.success('Strony prawne zapisane')
    } catch {
      toast.error('Błąd podczas zapisywania')
    }
  }

  async function handleSaveFeatures() {
    try {
      await save({ showQuantitySelector, showStockBadge, showReviews, showBestsellers, enableGuestCheckout })
      toast.success('Ustawienia funkcji zapisane')
    } catch {
      toast.error('Błąd podczas zapisywania')
    }
  }

  const tabs: { id: Tab; label: string; icon: typeof Settings }[] = [
    { id: 'analytics', label: 'Analityka', icon: Settings },
    { id: 'legal', label: 'Strony Prawne', icon: FileText },
    { id: 'features', label: 'Funkcje sklepu', icon: ToggleLeft },
  ]

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-semibold text-cream">Ustawienia</h1>

      <div className="flex gap-1 border-b border-border">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === id
                ? 'border-primary text-primary'
                : 'border-transparent text-cream-muted hover:text-cream'
            }`}
          >
            <Icon size={15} strokeWidth={1.5} />
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <>
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="bg-card rounded-lg border border-border p-6 space-y-5">
                <div>
                  <h2 className="text-sm font-semibold text-cream mb-1">Google Analytics 4</h2>
                  <p className="text-xs text-cream-muted mb-4">
                    Skrypt GA4 zostanie wstrzyknięty tylko po wyrażeniu zgody przez użytkownika.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="ga4Id">Measurement ID</Label>
                    <Input
                      id="ga4Id"
                      value={ga4Id}
                      onChange={(e) => setGa4Id(e.target.value)}
                      placeholder="G-XXXXXXXXXX"
                    />
                  </div>
                </div>

                <div className="border-t border-border pt-5">
                  <h2 className="text-sm font-semibold text-cream mb-1">Facebook Pixel</h2>
                  <p className="text-xs text-cream-muted mb-4">
                    Pixel zostanie wstrzyknięty tylko po wyrażeniu zgody przez użytkownika.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="fbPixelId">Pixel ID</Label>
                    <Input
                      id="fbPixelId"
                      value={fbPixelId}
                      onChange={(e) => setFbPixelId(e.target.value)}
                      placeholder="000000000000000"
                    />
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveAnalytics} disabled={isPending}>
                {isPending ? 'Zapisywanie…' : 'Zapisz analitykę'}
              </Button>
            </div>
          )}

          {activeTab === 'features' && (
            <div className="space-y-6">
              <div className="bg-card rounded-lg border border-border divide-y divide-border">
                {([
                  {
                    key: 'showQuantitySelector' as const,
                    value: showQuantitySelector,
                    set: setShowQuantitySelector,
                    label: 'Wybór ilości na stronie produktu',
                    description: 'Wyświetla pole +/− pozwalające klientowi wybrać ilość przed dodaniem do koszyka.',
                  },
                  {
                    key: 'showStockBadge' as const,
                    value: showStockBadge,
                    set: setShowStockBadge,
                    label: 'Stan magazynowy na stronie produktu',
                    description: 'Pokazuje "W magazynie (X szt.)" lub "Brak w magazynie" na karcie produktu.',
                  },
                  {
                    key: 'showReviews' as const,
                    value: showReviews,
                    set: setShowReviews,
                    label: 'Sekcja opinii na stronie produktu',
                    description: 'Wyświetla opinie klientów i formularz dodawania recenzji pod produktem.',
                  },
                  {
                    key: 'showBestsellers' as const,
                    value: showBestsellers,
                    set: setShowBestsellers,
                    label: 'Sekcja bestsellerów na stronie głównej',
                    description: 'Pokazuje karuzelę / siatkę bestsellerów na stronie głównej sklepu.',
                  },
                  {
                    key: 'enableGuestCheckout' as const,
                    value: enableGuestCheckout,
                    set: setEnableGuestCheckout,
                    label: 'Zakup bez rejestracji (gość)',
                    description: 'Pozwala klientom składać zamówienia bez zakładania konta.',
                  },
                ] as const).map(({ value, set, label, description }) => (
                  <div key={label} className="flex items-center justify-between gap-4 px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-cream">{label}</p>
                      <p className="text-xs text-cream-muted mt-0.5">{description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => set(!value)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                        value ? 'bg-primary' : 'bg-ink-600'
                      }`}
                      role="switch"
                      aria-checked={value}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                          value ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
              <Button onClick={handleSaveFeatures} disabled={isPending}>
                {isPending ? 'Zapisywanie…' : 'Zapisz ustawienia funkcji'}
              </Button>
            </div>
          )}

          {activeTab === 'legal' && (
            <div className="space-y-6">
              <div className="bg-card rounded-lg border border-border p-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="terms">
                    Regulamin{' '}
                    <span className="text-cream-muted font-normal">(/regulamin)</span>
                  </Label>
                  <Textarea
                    id="terms"
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    rows={16}
                    placeholder="Treść regulaminu sklepu…"
                    className="font-mono text-xs leading-relaxed"
                  />
                </div>

                <div className="border-t border-border pt-5 space-y-2">
                  <Label htmlFor="privacy">
                    Polityka prywatności{' '}
                    <span className="text-cream-muted font-normal">(/polityka-prywatnosci)</span>
                  </Label>
                  <Textarea
                    id="privacy"
                    value={privacy}
                    onChange={(e) => setPrivacy(e.target.value)}
                    rows={16}
                    placeholder="Treść polityki prywatności…"
                    className="font-mono text-xs leading-relaxed"
                  />
                </div>
              </div>

              <Button onClick={handleSaveLegal} disabled={isPending}>
                {isPending ? 'Zapisywanie…' : 'Zapisz strony prawne'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
