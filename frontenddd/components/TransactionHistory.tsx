'use client'

import { useState } from 'react'

interface Transaction {
  id: number
  txId: string
  timestamp: string
  amount: string
}

interface TransactionHistoryProps {
  transactions: Transaction[]
}

export default function TransactionHistory({ transactions }: TransactionHistoryProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copyToClipboard = async (txId: string) => {
    try {
      await navigator.clipboard.writeText(txId)
      setCopiedId(txId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="bg-[#181818] rounded-xl border border-[#2a2a2a] p-8 animate-fadeIn animation-delay-200 transition-all duration-300 hover:border-[#3a3a3a]">
      <h2 className="text-[24px] font-bold text-white mb-6">Transaction History</h2>

      <div className="overflow-x-auto">
        <div className="max-h-[400px] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-[#181818]">
              <tr className="border-b border-[#2a2a2a]">
                <th className="text-left py-3 px-4 text-[13px] font-semibold text-gray-400">Serial No</th>
                <th className="text-left py-3 px-4 text-[13px] font-semibold text-gray-400">Transaction ID</th>
                <th className="text-left py-3 px-4 text-[13px] font-semibold text-gray-400">Timestamp</th>
                <th className="text-right py-3 px-4 text-[13px] font-semibold text-gray-400">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr
                  key={tx.id}
                  className="border-b border-[#2a2a2a]/50 hover:bg-[#1f1f1f] transition-all duration-200"
                >
                  <td className="py-4 px-4 text-[13px] text-gray-300">#{tx.id}</td>
                  <td className="py-4 px-4 text-[13px] text-[#7c6aef] font-mono">
                    <div className="flex items-center gap-2 group">
                      <span>{tx.txId}</span>
                      <button
                        onClick={() => copyToClipboard(tx.txId)}
                        className="relative opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-[#2a2a2a] rounded"
                        aria-label="Copy transaction ID"
                      >
                        {copiedId === tx.txId ? (
                          <svg
                            className="w-3.5 h-3.5 text-green-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-3.5 h-3.5 text-gray-400 hover:text-white transition-colors"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        )}
                        {copiedId === tx.txId && (
                          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#2a2a2a] text-white text-[11px] px-2 py-1 rounded whitespace-nowrap animate-fadeIn">
                            Copied!
                          </span>
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-[13px] text-gray-400">{tx.timestamp}</td>
                  <td className="py-4 px-4 text-[13px] text-white text-right font-medium">{tx.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {transactions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-[14px]">No transactions yet</p>
        </div>
      )}
    </div>
  )
}
