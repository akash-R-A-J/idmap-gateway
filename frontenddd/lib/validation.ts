import { PublicKey, Connection } from '@solana/web3.js'

export function isValidSolanaPublicKey(key: string): boolean {
  try {
    new PublicKey(key)
    return true
  } catch {
    return false
  }
}

export function isValidAmount(amount: number): boolean {
  return typeof amount === 'number' && amount > 0 && isFinite(amount)
}

// Check if a Solana account actually exists on the blockchain
export async function checkSolanaAccountExists(publicKeyString: string): Promise<{
  exists: boolean
  error?: string
  warning?: string
}> {
  try {
    // First validate the format
    if (!isValidSolanaPublicKey(publicKeyString)) {
      return { exists: false, error: 'Invalid public key format' }
    }

    // Try mainnet first (real network), fallback to devnet if rate limited
    // For production, use a paid RPC provider like Helius, QuickNode, or Alchemy
    const RPC_ENDPOINTS = [
      'https://api.mainnet-beta.solana.com', // Mainnet (real network)
      'https://api.devnet.solana.com', // Devnet fallback (test network)
    ]

    const publicKey = new PublicKey(publicKeyString)
    let lastError: any = null
    let triedMainnet = false

    // Try multiple endpoints
    for (let i = 0; i < RPC_ENDPOINTS.length; i++) {
      const endpoint = RPC_ENDPOINTS[i]
      const isMainnet = endpoint.includes('mainnet')
      const isDevnet = endpoint.includes('devnet')

      if (isMainnet) triedMainnet = true

      try {
        const connection = new Connection(endpoint, 'confirmed')
        const accountInfo = await connection.getAccountInfo(publicKey)

        // Success! Return result with appropriate warning
        return {
          exists: accountInfo !== null,
          error: accountInfo === null ? 'Account does not exist on blockchain' : undefined,
          warning: isDevnet && triedMainnet ? 'Mainnet rate limited. Checked on Devnet (test network)' : undefined
        }
      } catch (err: any) {
        lastError = err
        // If 403/429 (rate limit), try next endpoint
        if (err.message?.includes('403') || err.message?.includes('429') || err.message?.includes('forbidden')) {
          continue
        }
        // If other error, return it immediately
        break
      }
    }

    // If all endpoints failed with rate limit errors
    if (lastError?.message?.includes('403') || lastError?.message?.includes('429') || lastError?.message?.includes('forbidden')) {
      return {
        exists: true, // Assume valid format means it could exist
        warning: 'Unable to verify on blockchain (rate limited). Key format is valid.'
      }
    }

    return {
      exists: false,
      error: lastError?.message || 'Failed to verify account on blockchain'
    }
  } catch (error: any) {
    return {
      exists: false,
      error: error.message || 'Failed to verify account on blockchain'
    }
  }
}
