'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useAuth } from '../../lib/auth'

const schema = z
  .object({
    email: z.string().email('Nieprawidłowy adres email'),
    password: z.string().min(8, 'Hasło musi mieć co najmniej 8 znaków'),
    confirmPassword: z.string().min(1, 'Potwierdź hasło'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Hasła nie są identyczne',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof schema>

export default function RegisterPage() {
  const { register: registerUser } = useAuth()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)
    try {
      await registerUser(values.email, values.password)
      toast.success('Konto utworzone pomyślnie')
      router.push('/konto')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: unknown } } })?.response?.data?.message
      toast.error(typeof msg === 'string' ? msg : 'Rejestracja nie powiodła się. Sprawdź dane i spróbuj ponownie.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-medium text-stone-900 italic mb-2">
            Utwórz konto
          </h1>
          <p className="text-stone-500 text-sm">Dołącz do nas i śledź swoje zamówienia</p>
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
                autoComplete="new-password"
                className={inputCls(!!errors.password)}
                placeholder="Minimum 8 znaków"
              />
            </Field>

            <Field label="Potwierdź hasło" error={errors.confirmPassword?.message}>
              <input
                {...register('confirmPassword')}
                type="password"
                autoComplete="new-password"
                className={inputCls(!!errors.confirmPassword)}
                placeholder="••••••••"
              />
            </Field>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-stone-900 text-white text-sm font-medium rounded-2xl hover:bg-stone-700 transition-colors disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? 'Tworzenie konta…' : 'Zarejestruj się'}
            </button>
          </form>

          <div className="relative flex items-center gap-3">
            <div className="flex-1 h-px bg-stone-200" />
            <span className="text-xs text-stone-400">lub</span>
            <div className="flex-1 h-px bg-stone-200" />
          </div>

          <a
            href={`${process.env.NEXT_PUBLIC_API_URL}/auth/google`}
            className="flex items-center justify-center gap-2.5 w-full py-2.5 border border-stone-200 rounded-2xl text-sm text-stone-700 hover:border-stone-400 hover:bg-stone-50 transition-colors"
          >
            <GoogleIcon />
            Zarejestruj się przez Google
          </a>

          <p className="text-center text-sm text-stone-500">
            Masz już konto?{' '}
            <Link href="/logowanie" className="text-stone-900 font-medium underline hover:no-underline">
              Zaloguj się
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" />
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
    </svg>
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
