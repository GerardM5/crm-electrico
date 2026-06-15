import { type ComponentType, lazy } from 'react'

type Factory<T extends ComponentType<unknown>> = () => Promise<{ default: T }>

const RELOAD_KEY = 'crm-electrico-chunk-reload'

/**
 * Envuelve React.lazy para tolerar despliegues: cuando un chunk con hash
 * desaparece tras un nuevo deploy, el import dinámico falla con
 * "Failed to fetch dynamically imported module". En ese caso recargamos la
 * página una sola vez para obtener el index.html con los nuevos hashes.
 */
export function lazyWithRetry<T extends ComponentType<unknown>>(factory: Factory<T>) {
  return lazy(async () => {
    try {
      const component = await factory()
      window.sessionStorage.removeItem(RELOAD_KEY)
      return component
    } catch (error) {
      const alreadyReloaded = window.sessionStorage.getItem(RELOAD_KEY)
      if (!alreadyReloaded) {
        window.sessionStorage.setItem(RELOAD_KEY, '1')
        window.location.reload()
        return new Promise<{ default: T }>(() => {})
      }
      throw error
    }
  })
}
