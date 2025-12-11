"use client"

import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useState, useRef } from "react"

interface SortableHeaderProps {
    column: string
    label: string
    currentSort?: string
    currentOrder?: string
}

export function SortableHeader({ column, label, currentSort, currentOrder }: SortableHeaderProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isNavigating, setIsNavigating] = useState(false)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

    const handleSort = () => {
        if (isNavigating) return; // Prevent multiple clicks

        setIsNavigating(true)

        const params = new URLSearchParams(searchParams.toString())

        // Toggle order if clicking same column, Otherwise default to desc
        if (currentSort === column) {
            params.set('order', currentOrder === 'desc' ? 'asc' : 'desc')
        } else {
            params.set('sort', column)
            params.set('order', 'desc')
        }

        // Reset to page 1 when sorting
        params.set('page', '1')

        router.push(`?${params.toString()}`)

        // Reset navigation state after delay
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        timeoutRef.current = setTimeout(() => {
            setIsNavigating(false)
        }, 500)
    }

    const isActive = currentSort === column
    const Icon = isActive ? (currentOrder === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown

    return (
        <Button
            variant="ghost"
            onClick={handleSort}
            disabled={isNavigating}
            className="-ml-3 h-8 data-[state=open]:bg-accent"
        >
            <span>{label}</span>
            <Icon className={`ml-2 h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
        </Button>
    )
}
