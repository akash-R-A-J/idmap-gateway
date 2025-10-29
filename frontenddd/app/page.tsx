'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import MinimalBackground from '@/components/MinimalBackground'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'authenticated') {
      // User is logged in, go to transfer page
      router.replace('/transfer')
    } else {
      // User is not logged in, go to signup page
      router.replace('/signup')
    }
  }, [status, router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <MinimalBackground />
      <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  )
}
