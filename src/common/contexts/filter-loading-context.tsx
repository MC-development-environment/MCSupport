"use client"

import { createContext, useContext, ReactNode, useTransition } from "react"

interface FilterLoadingContextType {
    isPending: boolean
    startTransition: (callback: () => void) => void
}

const FilterLoadingContext = createContext<FilterLoadingContextType | null>(null)

export function FilterLoadingProvider({ children }: { children: ReactNode }) {
    const [isPending, startTransition] = useTransition()

    return (
        <FilterLoadingContext.Provider value={{ isPending, startTransition }}>
            {children}
        </FilterLoadingContext.Provider>
    )
}

export function useFilterLoading() {
    const context = useContext(FilterLoadingContext)
    if (!context) {
        throw new Error("useFilterLoading must be used within FilterLoadingProvider")
    }
    return context
}
