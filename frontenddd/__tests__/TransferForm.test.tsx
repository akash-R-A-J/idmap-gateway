import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import TransferForm from '@/components/TransferForm'
import { transferTokens } from '@/lib/fetcher'
import { Session } from 'next-auth'

jest.mock('@/lib/fetcher')
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}))

const mockSession: Session = {
  user: { email: 'test@example.com', name: 'Test User' },
  expires: '2025-12-31',
}

describe('TransferForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('validates invalid Solana public key', async () => {
    render(<TransferForm session={mockSession} />)

    const keyInput = screen.getByLabelText(/recipient public key/i)
    const amountInput = screen.getByLabelText(/amount/i)
    const submitButton = screen.getByRole('button', { name: /send transfer/i })

    fireEvent.change(keyInput, { target: { value: 'invalid-key' } })
    fireEvent.change(amountInput, { target: { value: '1' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/invalid solana public key format/i)).toBeInTheDocument()
    })

    expect(transferTokens).not.toHaveBeenCalled()
  })

  it('validates non-positive amount', async () => {
    render(<TransferForm session={mockSession} />)

    const keyInput = screen.getByLabelText(/recipient public key/i)
    const amountInput = screen.getByLabelText(/amount/i)
    const submitButton = screen.getByRole('button', { name: /send transfer/i })

    // Use a valid Solana public key (base58, 32-44 chars)
    fireEvent.change(keyInput, {
      target: { value: '11111111111111111111111111111111' },
    })
    fireEvent.change(amountInput, { target: { value: '-1' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/amount must be a positive number/i)).toBeInTheDocument()
    })

    expect(transferTokens).not.toHaveBeenCalled()
  })

  it('submits valid transfer', async () => {
    const mockTransferTokens = transferTokens as jest.MockedFunction<typeof transferTokens>
    mockTransferTokens.mockResolvedValue({
      success: true,
      transactionId: 'abc123',
    })

    render(<TransferForm session={mockSession} />)

    const keyInput = screen.getByLabelText(/recipient public key/i)
    const amountInput = screen.getByLabelText(/amount/i)
    const submitButton = screen.getByRole('button', { name: /send transfer/i })

    fireEvent.change(keyInput, {
      target: { value: '11111111111111111111111111111111' },
    })
    fireEvent.change(amountInput, { target: { value: '5' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(transferTokens).toHaveBeenCalledWith(
        {
          recipientPublicKey: '11111111111111111111111111111111',
          amount: 5,
        },
        mockSession
      )
    })
  })
})
