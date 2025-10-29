import { Session } from 'next-auth'

export interface TransferRequest {
  recipientPublicKey: string
  amount: number
}

export interface TransferResponse {
  success: boolean
  transactionId?: string
  message?: string
}

export async function transferTokens(
  data: TransferRequest,
  session: Session | null
): Promise<TransferResponse> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'
  const token = (session as any)?.accessToken || ''

  const response = await fetch(`${backendUrl}/api/transfer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || 'Transfer failed')
  }

  return response.json()
}
