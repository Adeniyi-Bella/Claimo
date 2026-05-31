import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import type { RouterContext } from '@/lib/router'
import { DashboardLoader } from '@/components/common/loader/loader'
import { useAuth } from '@/hooks/auth/useAuth'
import { useEffect, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { UnauthorizedError } from '@/api/error/customeError'
import { UserApi } from '@/api/user.api'

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
  const { isAuthenticated, isLoading, isLoaded, getToken, userId } = useAuth()
  const lastSyncedUserIdRef = useRef<string | null>(null)

  const { mutate: syncInvites, isPending: isSyncingInvites } = useMutation({
    mutationFn: async () => {
      const token = await getToken()
      if (!token) {
        throw new UnauthorizedError('No active session', 'AUTH_NO_TOKEN', 401)
      }

      await UserApi.syncInvites(token)
    },
    retry: false,
  })

  useEffect(() => {
    if (!isLoaded) {
      return
    }

    if (!isAuthenticated) {
      lastSyncedUserIdRef.current = null
      return
    }

    if (!userId || lastSyncedUserIdRef.current === userId) {
      return
    }

    lastSyncedUserIdRef.current = userId
    syncInvites()
  }, [isAuthenticated, isLoaded, syncInvites, userId])

  if (isLoading || (isAuthenticated && (lastSyncedUserIdRef.current !== userId || isSyncingInvites))) {
    return <DashboardLoader />
  }
  if (!isAuthenticated) return <DashboardLoader />

  return <Outlet />
}
