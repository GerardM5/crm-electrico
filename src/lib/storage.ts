export const storageBuckets = {
  invoices: {
    bucket: 'invoices',
    maxBytes: 10 * 1024 * 1024,
    accept: 'application/pdf',
  },
  proposals: {
    bucket: 'proposals',
    maxBytes: 10 * 1024 * 1024,
    accept: 'application/pdf',
  },
  contracts: {
    bucket: 'contracts',
    maxBytes: 15 * 1024 * 1024,
    accept: 'application/pdf',
  },
  customerDocuments: {
    bucket: 'customer-documents',
    maxBytes: 15 * 1024 * 1024,
    accept: 'application/pdf,image/jpeg,image/png,image/webp',
  },
  installationPhotos: {
    bucket: 'installation-photos',
    maxBytes: 8 * 1024 * 1024,
    accept: 'image/jpeg,image/png,image/webp',
  },
}

export function buildStoragePath(organizationId: string, customerId: string, entityId: string, fileName: string) {
  const safeName = fileName.toLowerCase().replace(/[^a-z0-9.]+/g, '-')
  return `${organizationId}/${customerId}/${entityId}/${safeName}`
}
