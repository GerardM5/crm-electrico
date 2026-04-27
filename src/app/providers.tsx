import { QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode } from 'react'
import { Toaster } from 'sonner'
import { queryClient } from './query-client'
import { DemoStoreProvider } from '../store/demo-store'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <DemoStoreProvider>
        {children}
        <Toaster richColors position="top-right" closeButton />
      </DemoStoreProvider>
    </QueryClientProvider>
  )
}
