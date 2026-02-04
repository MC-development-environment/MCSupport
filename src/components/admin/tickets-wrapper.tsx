"use client"

import { ReactNode } from "react"
import { FilterLoadingProvider } from "@/common/contexts/filter-loading-context"

export function TicketsWrapper({ children }: { children: ReactNode }) {
    return (
        <FilterLoadingProvider>
            {children}
        </FilterLoadingProvider>
    )
}
