import { addMonths } from 'date-fns'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// ─── Mocks ──────────────────────────────────────────────────────────────────

const mockUpdateMutate = vi.fn()
const mockLogMutate = vi.fn()
const mockToast = { success: vi.fn(), error: vi.fn() }
const mockToastError = vi.fn()

vi.mock('../services/customers.service', () => ({
  useUpdateCustomer: () => ({ mutate: mockUpdateMutate, isPending: false }),
}))

vi.mock('../services/activity.service', () => ({
  useLogActivity: () => ({ mutate: mockLogMutate }),
}))

vi.mock('sonner', () => ({ toast: mockToast }))

vi.mock('./use-toast-error', () => ({ useToastError: () => mockToastError }))

vi.mock('../lib/formatters', () => ({
  formatDate: (iso: string) => iso.slice(0, 10),
}))

// ─── System Under Test ───────────────────────────────────────────────────────

// Import AFTER mocks are registered
const { useCustomerActions } = await import('./use-customer-actions')

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDateColumn(date: Date) {
  return date.toISOString().slice(0, 10)
}

const customer = { id: 'c1', name: 'Energiza SA' }

describe('useCustomerActions – renewCustomer', () => {
  let capturedOptions: { onSuccess?: () => void; onError?: () => void }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUpdateMutate.mockImplementation((_payload: unknown, options: typeof capturedOptions) => {
      capturedOptions = options
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('calls updateCustomer with status "renewed"', () => {
    const { renewCustomer } = useCustomerActions()
    renewCustomer(customer)

    const [payload] = mockUpdateMutate.mock.calls[0]
    expect(payload.status).toBe('renewed')
  })

  it('sets contract_signed_at to today', () => {
    const today = new Date()
    const { renewCustomer } = useCustomerActions()
    renewCustomer(customer)

    const [payload] = mockUpdateMutate.mock.calls[0]
    expect(payload.contract_signed_at).toBe(toDateColumn(today))
  })

  it('sets renewal_date to today + 12 months', () => {
    const today = new Date()
    const expected = toDateColumn(addMonths(today, 12))
    const { renewCustomer } = useCustomerActions()
    renewCustomer(customer)

    const [payload] = mockUpdateMutate.mock.calls[0]
    expect(payload.renewal_date).toBe(expected)
  })

  it('logs activity with action "renewed" on success', () => {
    const { renewCustomer } = useCustomerActions()
    renewCustomer(customer)

    // Simulate success callback
    capturedOptions.onSuccess?.()

    expect(mockLogMutate).toHaveBeenCalledOnce()
    const [logPayload] = mockLogMutate.mock.calls[0]
    expect(logPayload.action).toBe('renewed')
    expect(logPayload.entityId).toBe('c1')
  })

  it('shows success toast on success', () => {
    const { renewCustomer } = useCustomerActions()
    renewCustomer(customer)

    capturedOptions.onSuccess?.()

    expect(mockToast.success).toHaveBeenCalledOnce()
    const [message] = mockToast.success.mock.calls[0]
    expect(message).toContain('Energiza SA')
  })

  it('calls onError handler when mutation fails', () => {
    const { renewCustomer } = useCustomerActions()
    renewCustomer(customer)

    capturedOptions.onError?.()

    expect(mockToastError).toHaveBeenCalledOnce()
  })
})
