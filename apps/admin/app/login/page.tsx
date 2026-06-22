'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import axios from 'axios'
import Image from 'next/image'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const schema = z.object({
  email: z.string().email('Nieprawidłowy email'),
  password: z.string().min(1, 'Hasło jest wymagane'),
})
type FormValues = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    setServerError(null)
    try {
      const { data } = await axios.post<{ accessToken: string }>(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api'}/auth/login`,
        values,
        { withCredentials: true },
      )
      // Decode role from JWT payload (middle base64 segment)
      const payload = JSON.parse(atob(data.accessToken.split('.')[1])) as { role: string }
      if (payload.role !== 'ADMIN') {
        setServerError('Brak dostępu do panelu administratora')
        return
      }
      localStorage.setItem('admin_token', data.accessToken)
      router.push('/')
    } catch {
      setServerError('Nieprawidłowy email lub hasło')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink">
      <Card className="w-full max-w-sm border-ink-600">
        <CardHeader className="items-center pb-2">
          <Image src="/LA-logo-horizonal.png" alt="Lune Atelier" width={260} height={87} className="h-28 w-auto object-contain mb-1" />
          <p className="text-xs text-cream-muted mt-1">Panel administracyjny</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Hasło</Label>
              <Input id="password" type="password" autoComplete="current-password" {...register('password')} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            {serverError && (
              <p className="text-sm text-destructive">{serverError}</p>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Logowanie...' : 'Zaloguj się'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
