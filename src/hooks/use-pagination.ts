import { useMemo, useState } from 'react'

export interface PaginationState {
  page: number
  pageSize: number
}

export interface PaginationResult<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
  setPage: (page: number) => void
  setPageSize: (size: number) => void
}

export function usePagination<T>(allItems: T[], defaultPageSize = 25): PaginationResult<T> {
  const [page, setPageRaw] = useState(1)
  const [pageSize, setPageSizeRaw] = useState(defaultPageSize)

  const total = allItems.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  // Clamp page so it never exceeds totalPages (handles filter reductions)
  const safePage = Math.min(page, totalPages)

  const items = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return allItems.slice(start, start + pageSize)
  }, [allItems, safePage, pageSize])

  function setPage(next: number) {
    setPageRaw(Math.max(1, Math.min(next, totalPages)))
  }

  function setPageSize(size: number) {
    setPageSizeRaw(size)
    setPageRaw(1)
  }

  return { items, page: safePage, pageSize, total, totalPages, setPage, setPageSize }
}
