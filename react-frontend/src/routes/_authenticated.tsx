import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import type { RouterContext } from '@/lib/router'
import { DashboardLoader } from '@/components/common/loader/loader'
import { useAuth } from '@/hooks/auth/useAuth'
import { useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context }) => {
    const { auth } = context as RouterContext
    if (auth?.isLoaded && !auth?.isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: '/login' })
    }
  }, [isLoading, isAuthenticated, navigate])

  if (isLoading) return <DashboardLoader />
  if (!isAuthenticated) return <DashboardLoader />

  return <Outlet />
}