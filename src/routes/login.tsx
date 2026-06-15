import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Field, Input } from '../components/ui/input'
import { appBrand } from '../config/nav'
import { useAuth } from '../features/auth/AuthContext'
import { supabase } from '../lib/supabase'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
})
type LoginValues = z.infer<typeof loginSchema>

function LoginForm() {
  const [serverError, setServerError] = useState<string | null>(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(values: LoginValues) {
    setServerError(null)
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })
    if (error) {
      setServerError(
        error.message.includes('Invalid login credentials')
          ? 'Email o contraseña incorrectos.'
          : error.message,
      )
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
      <Field label="Email" error={errors.email?.message} required>
        <Input {...register('email')} type="email" inputMode="email" autoComplete="email" placeholder="ana@empresa.com" autoFocus aria-invalid={!!errors.email} />
      </Field>
      <Field label="Contraseña" error={errors.password?.message} required>
        <Input {...register('password')} type="password" autoComplete="current-password" placeholder="••••••••" aria-invalid={!!errors.password} />
      </Field>
      {serverError && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
      )}
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Entrando…' : 'Iniciar sesión'}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        <Link to="/forgot-password" className="underline underline-offset-4 hover:text-foreground">
          ¿Olvidaste tu contraseña?
        </Link>
      </p>
    </form>
  )
}

export function LoginRoute() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  const destination = (location.state as { from?: string } | null)?.from ?? '/dashboard'

  if (isAuthenticated) return <Navigate to={destination} replace />

  return (
    <main className="grid min-h-dvh place-items-center bg-muted p-4">
      <Card className="w-full max-w-sm">
        <CardContent className="p-8">
          <div className="mb-8">
            <h1 className="text-xl font-semibold text-foreground">{appBrand.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Inicia sesión con tu cuenta.</p>
          </div>
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  )
}
