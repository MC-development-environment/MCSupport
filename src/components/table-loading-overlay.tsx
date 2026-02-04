"use client"

import { ReactNode } from "react"
import { useFilterLoading } from "@/common/contexts/filter-loading-context"
import { Loader2 } from "lucide-react"

export function TableLoadingOverlay({ children }: { children: ReactNode }) {
    const { isPending } = useFilterLoading()

    return (
        <div className="relative">
            {children}
            {isPending && (
                <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 rounded-lg">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )}
        </div>
    )
}
