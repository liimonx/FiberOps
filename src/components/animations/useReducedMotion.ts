import { useSyncExternalStore } from 'react'

const subscribe = (callback: () => void) => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    mediaQuery.addEventListener('change', callback)
    return () => mediaQuery.removeEventListener('change', callback)
}

const getSnapshot = () => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

const getServerSnapshot = () => {
    return false
}

/**
 * Hook to detect if the user has requested reduced motion.
 * Uses useSyncExternalStore to avoid cascading renders and handle SSR correctly.
 */
export const useReducedMotion = (): boolean => {
    return useSyncExternalStore(
        subscribe,
        getSnapshot,
        getServerSnapshot
    )
}
