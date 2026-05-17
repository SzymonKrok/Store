'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Settings, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { useStoreSettings, useUpdateStoreSettings } from '@/lib/api/settings'

type Tab = 'analytics' | 'legal'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('analytics')
  const { data: settings, isLoading } = useStoreSettings()
  const { mutateAsync: save, isPending } = useUpdateStoreSettings()

  const [ga4Id, setGa4Id] = useState('')
  const [fbPixelId, setFbPixelId] = useState('')
  const [terms, setTerms] = useState('')
  const [privacy, setPrivacy] = useState('')

  useEffect(() => {
    if (settings) {
      setGa4Id(settings.ga4Id ?? '')
      setFbPixelId(settings.fbPixelId ?? '')
      setTerms(settings.termsOfService)
      setPrivacy(settings.privacyPolicy)
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

  const tabs: { id: Tab; label: string; icon: typeof Settings }[] = [
    { id: 'analytics', label: 'Analityka', icon: Settings },
    { id: 'legal', label: 'Strony Prawne', icon: FileText },
  ]

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-semibold text-slate-900">Ustawienia</h1>

      <div className="flex gap-1 border-b border-slate-200">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === id
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-900'
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
              <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-5">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 mb-1">Google Analytics 4</h2>
                  <p className="text-xs text-slate-500 mb-4">
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

                <div className="border-t border-slate-100 pt-5">
                  <h2 className="text-sm font-semibold text-slate-900 mb-1">Facebook Pixel</h2>
                  <p className="text-xs text-slate-500 mb-4">
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

          {activeTab === 'legal' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="terms">
                    Regulamin{' '}
                    <span className="text-slate-400 font-normal">(/regulamin)</span>
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

                <div className="border-t border-slate-100 pt-5 space-y-2">
                  <Label htmlFor="privacy">
                    Polityka prywatności{' '}
                    <span className="text-slate-400 font-normal">(/polityka-prywatnosci)</span>
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
