'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useAuth } from '../../lib/auth'

const schema = z.object({
  email: z.string().email('Nieprawidłowy adres email'),
  password: z.string().min(1, 'Hasło jest wymagane'),
})

type FormValues = z.infer<typeof schema>

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/konto'
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)
    try {
      await login(values.email, values.password)
      toast.success('Zalogowano pomyślnie')
      router.push(redirect)
    } catch {
      toast.error('Nieprawidłowy email lub hasło')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-medium text-stone-900 italic mb-2">
            Zaloguj się
          </h1>
          <p className="text-stone-500 text-sm">Witaj z powrotem</p>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-8 space-y-5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Field label="Email" error={errors.email?.message}>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                className={inputCls(!!errors.email)}
                placeholder="jan@example.com"
              />
            </Field>

            <Field label="Hasło" error={errors.password?.message}>
              <input
                {...register('password')}
                type="password"
                autoComplete="current-password"
                className={inputCls(!!errors.password)}
                placeholder="••••••••"
              />
            </Field>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-stone-900 text-white text-sm font-medium rounded-2xl hover:bg-stone-700 transition-colors disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? 'Logowanie…' : 'Zaloguj się'}
            </button>
          </form>

          <p className="text-center text-sm text-stone-500">
            Nie masz konta?{' '}
            <Link href="/rejestracja" className="text-stone-900 font-medium underline hover:no-underline">
              Zarejestruj się
            </Link>
          </p>
        </div>
      </div>
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

function inputCls(hasError = false) {
  return `w-full h-10 px-3 text-sm border rounded-xl focus:outline-none focus:border-stone-400 bg-white transition-colors ${
    hasError ? 'border-red-300 focus:border-red-400' : 'border-stone-200'
  }`
}
