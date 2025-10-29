'use client'

import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'

interface NavbarProps {
  showLogout?: boolean
  userEmail?: string
}

export default function Navbar({ showLogout = false, userEmail }: NavbarProps) {
  const { data: session } = useSession()

  const handleLogout = () => {
    signOut({ callbackUrl: '/signin' })
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0f0f0f] border-b border-[#2a2a2a]">
      <div className="max-w-7xl mx-auto px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Name */}
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="IdMap" className="w-9 h-9 rounded-md object-cover" />
            <span className="text-lg font-semibold text-white">Id&lt;Map&gt;</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-8">
            {!showLogout && (
              <Link
                href="/signup"
                className="text-[14px] text-gray-400 hover:text-white transition-colors font-medium"
              >
                Sign up
              </Link>
            )}
            <Link
              href="#contact"
              className="text-[14px] text-gray-400 hover:text-white transition-colors font-medium"
            >
              Contact
            </Link>
            <Link
              href="/about"
              className="text-[14px] text-gray-400 hover:text-white transition-colors font-medium"
            >
              About
            </Link>
            {showLogout && session && (
              <button
                onClick={handleLogout}
                className="text-[14px] text-[#7c6aef] hover:text-white transition-colors font-medium"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
