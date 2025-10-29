import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import TransferForm from '@/components/TransferForm'
import Navbar from '@/components/Navbar'
import TransactionHistory from '@/components/TransactionHistory'

export default async function TransferPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/signin')
  }

  // Sample transaction history data
  const sampleTransactions = [
    {
      id: 1,
      txId: '5JxK7...9mP2',
      timestamp: '2025-01-15 14:32:10',
      amount: '2.5 SOL'
    },
    {
      id: 2,
      txId: '8Hn3M...4kQ7',
      timestamp: '2025-01-14 09:15:22',
      amount: '1.2 SOL'
    },
    {
      id: 3,
      txId: '3Wp9L...7vR1',
      timestamp: '2025-01-13 18:45:33',
      amount: '5.0 SOL'
    },
    {
      id: 4,
      txId: '9Tz2K...6pN8',
      timestamp: '2025-01-12 22:10:44',
      amount: '0.75 SOL'
    },
    {
      id: 5,
      txId: '2Yq5P...3jM9',
      timestamp: '2025-01-11 11:20:55',
      amount: '3.3 SOL'
    }
  ]

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col">
      {/* Navbar */}
      <Navbar showLogout={true} />

      <main className="flex-1 pt-[72px] px-8 py-12">
        <div className="max-w-7xl mx-auto">
          {/* User Info - positioned on the right */}
          <div className="flex justify-end mb-6">
            <p className="text-[13px] text-gray-400">
              Logged in as <span className="text-white font-medium">{session.user?.email}</span>
            </p>
          </div>

          {/* Main Transfer Section */}
          <div className="max-w-2xl mx-auto mb-12 animate-fadeIn">
            {/* Transfer Form */}
            <div className="bg-[#181818] rounded-xl border border-[#2a2a2a] p-8 transition-all duration-300 hover:border-[#3a3a3a]">
              <h2 className="text-[24px] font-bold text-white mb-6">Send Transaction</h2>
              <TransferForm session={session} />
            </div>
          </div>

          {/* Transaction History Section */}
          <TransactionHistory transactions={sampleTransactions} />
        </div>
      </main>

      <footer className="w-full py-4 bg-[#0f0f0f] border-t border-[#2a2a2a]">
        <div className="flex items-center justify-center gap-4 text-[11px] text-gray-500">
          <span>© 2025 Id&lt;Map&gt;</span>
          <span>·</span>
          <a href="#" className="hover:text-gray-400 transition-colors">Support</a>
          <span>·</span>
          <a href="#" className="hover:text-gray-400 transition-colors">Privacy</a>
          <span>·</span>
          <a href="#" className="hover:text-gray-400 transition-colors">Terms</a>
        </div>
      </footer>
    </div>
  )
}
