'use client'

import { useState, useEffect, useRef } from 'react'
import { Session } from 'next-auth'
import toast from 'react-hot-toast'
import { transferTokens, TransferRequest } from '@/lib/fetcher'
import { isValidSolanaPublicKey, isValidAmount, checkSolanaAccountExists } from '@/lib/validation'

interface TransferFormProps {
  session: Session
}

export default function TransferForm({ session }: TransferFormProps) {
  const [recipientPublicKey, setRecipientPublicKey] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [validatingKey, setValidatingKey] = useState(false)
  const [keyValidationStatus, setKeyValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle')
  const [validationWarning, setValidationWarning] = useState<string | undefined>(undefined)
  const [errors, setErrors] = useState<{ key?: string; amount?: string }>({})
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Real-time blockchain validation with debounce
  useEffect(() => {
    // Clear previous timeout
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current)
    }

    // Reset validation status if input is empty
    if (!recipientPublicKey.trim()) {
      setKeyValidationStatus('idle')
      setValidatingKey(false)
      setValidationWarning(undefined)
      return
    }

    // Check format first
    if (!isValidSolanaPublicKey(recipientPublicKey)) {
      setKeyValidationStatus('invalid')
      setValidatingKey(false)
      setValidationWarning(undefined)
      return
    }

    // Debounce the blockchain check (wait 800ms after user stops typing)
    validationTimeoutRef.current = setTimeout(async () => {
      setValidatingKey(true)
      setKeyValidationStatus('idle')

      const result = await checkSolanaAccountExists(recipientPublicKey.trim())

      if (result.exists) {
        setKeyValidationStatus('valid')
        setErrors((prev) => ({ ...prev, key: undefined }))
        setValidationWarning(result.warning)
      } else {
        setKeyValidationStatus('invalid')
        setErrors((prev) => ({ ...prev, key: result.error || 'Account does not exist' }))
        setValidationWarning(undefined)
      }

      setValidatingKey(false)
    }, 800)

    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current)
      }
    }
  }, [recipientPublicKey])

  const validateForm = (): boolean => {
    const newErrors: { key?: string; amount?: string } = {}

    if (!recipientPublicKey.trim()) {
      newErrors.key = 'Recipient public key is required'
    } else if (!isValidSolanaPublicKey(recipientPublicKey)) {
      newErrors.key = 'Invalid Solana public key format'
    } else if (keyValidationStatus !== 'valid') {
      newErrors.key = 'Please wait for blockchain validation to complete'
    }

    const numAmount = parseFloat(amount)
    if (!amount) {
      newErrors.amount = 'Amount is required'
    } else if (isNaN(numAmount) || !isValidAmount(numAmount)) {
      newErrors.amount = 'Amount must be a positive number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const data: TransferRequest = {
        recipientPublicKey: recipientPublicKey.trim(),
        amount: parseFloat(amount),
      }

      const result = await transferTokens(data, session)

      if (result.success) {
        toast.success(
          `Transfer successful! Transaction ID: ${result.transactionId || 'N/A'}`
        )
        setRecipientPublicKey('')
        setAmount('')
        setErrors({})
        setKeyValidationStatus('idle')
        setValidationWarning(undefined)
      } else {
        toast.error(result.message || 'Transfer failed')
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during transfer')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="recipientPublicKey" className="block text-[13px] font-medium text-gray-300 mb-2">
          Recipient Public Key
        </label>
        <div className="relative group">
          <input
            id="recipientPublicKey"
            type="text"
            placeholder="Enter Solana public key"
            className={`w-full h-12 px-4 pr-12 text-[13px] bg-[#0f0f0f] border-2 rounded-lg focus:outline-none transition-all duration-200 text-white placeholder-gray-600 font-mono ${
              errors.key
                ? 'border-red-500/60 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                : keyValidationStatus === 'valid'
                ? 'border-green-500/60 focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
                : 'border-[#2a2a2a] focus:border-[#7c6aef] focus:ring-2 focus:ring-[#7c6aef]/20 hover:border-[#3a3a3a]'
            }`}
            value={recipientPublicKey}
            onChange={(e) => {
              setRecipientPublicKey(e.target.value)
              if (errors.key) setErrors({ ...errors, key: undefined })
            }}
            disabled={loading}
          />
          {/* Validation Status Icons */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {validatingKey && (
              <div className="w-4 h-4 border-2 border-[#7c6aef] border-t-transparent rounded-full animate-spin"></div>
            )}
            {!validatingKey && keyValidationStatus === 'valid' && (
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {!validatingKey && keyValidationStatus === 'invalid' && recipientPublicKey.trim() && (
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
        </div>
        {errors.key && (
          <p className="mt-2 text-[12px] text-red-400 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {errors.key}
          </p>
        )}
        {!errors.key && keyValidationStatus === 'valid' && !validationWarning && (
          <p className="mt-2 text-[12px] text-green-400 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Account verified on Solana blockchain
          </p>
        )}
        {!errors.key && keyValidationStatus === 'valid' && validationWarning && (
          <p className="mt-2 text-[12px] text-yellow-400 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {validationWarning}
          </p>
        )}
        {validatingKey && (
          <p className="mt-2 text-[12px] text-[#7c6aef] flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            Verifying account on blockchain...
          </p>
        )}
      </div>

      <div>
        <label htmlFor="amount" className="block text-[13px] font-medium text-gray-300 mb-2">
          Amount (SOL)
        </label>
        <input
          id="amount"
          type="number"
          step="0.000000001"
          placeholder="0.0"
          className={`w-full h-12 px-4 text-[13px] bg-[#0f0f0f] border-2 rounded-lg focus:outline-none transition-all duration-200 text-white placeholder-gray-600 ${
            errors.amount
              ? 'border-red-500/60 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
              : 'border-[#2a2a2a] focus:border-[#7c6aef] focus:ring-2 focus:ring-[#7c6aef]/20 hover:border-[#3a3a3a]'
          }`}
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value)
            if (errors.amount) setErrors({ ...errors, amount: undefined })
          }}
          disabled={loading}
        />
        {errors.amount && (
          <p className="mt-2 text-[12px] text-red-400 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {errors.amount}
          </p>
        )}
      </div>

      <button
        type="submit"
        className={`w-full h-12 rounded-lg font-semibold text-[14px] transition-all duration-200 flex items-center justify-center gap-2 mt-6 ${
          loading || validatingKey || keyValidationStatus !== 'valid'
            ? 'bg-[#2a2a2a] text-gray-500 cursor-not-allowed'
            : 'bg-[#7c6aef] text-white hover:bg-[#6b5bd4] hover:shadow-lg hover:shadow-[#7c6aef]/20 active:scale-[0.98]'
        }`}
        disabled={loading || validatingKey || keyValidationStatus !== 'valid'}
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Processing...
          </>
        ) : validatingKey ? (
          <>
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            Validating...
          </>
        ) : keyValidationStatus !== 'valid' ? (
          'Verify Public Key First'
        ) : (
          'Send Transfer'
        )}
      </button>

      <p className="text-[11px] text-gray-500 text-center mt-4">
        Make sure to verify the recipient address before sending
      </p>
    </form>
  )
}
