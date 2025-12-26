"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useRef, useCallback } from "react"
import { useTranslations } from "next-intl"

interface PaginationControlsProps {
    currentPage: number
    totalPages: number
    baseUrl: string
    totalCount?: number
    limit?: number
}

export function PaginationControls({
    currentPage,
    totalPages,
    baseUrl,
    totalCount,
    limit = 10
}: PaginationControlsProps) {
    const t = useTranslations('Admin.Pagination');
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isNavigating, setIsNavigating] = useState(false)
    const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const handlePageChange = useCallback((page: number) => {
        // Evitar navegación si ya está navegando o página inválida
        if (isNavigating || page < 1 || page > totalPages || page === currentPage) {
            return
        }

        // Establecer estado de navegación
        setIsNavigating(true)

        // Limpiar cualquier tiempo de espera existente
        if (navigationTimeoutRef.current) {
            clearTimeout(navigationTimeoutRef.current)
        }

        // Construir nueva URL
        const params = new URLSearchParams(searchParams.toString())
        params.set('page', page.toString())

        // Navegar
        router.push(`${baseUrl}?${params.toString()}`)

        // Restablecer estado de navegación después de un retraso (mecanismo de seguridad)
        navigationTimeoutRef.current = setTimeout(() => {
            setIsNavigating(false)
        }, 1000)
    }, [isNavigating, totalPages, currentPage, searchParams, router, baseUrl])

    if (totalPages <= 1 && !totalCount) return null

    const startRecord = totalCount ? (currentPage - 1) * limit + 1 : 0
    const endRecord = totalCount ? Math.min(currentPage * limit, totalCount) : 0

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-4 border-t">
            <div className="text-sm text-muted-foreground">
                {totalCount ? (
                    <div className="flex items-center gap-1.5">
                        <span className="text-foreground">{t('showing')}</span>
                        <span className="font-semibold text-foreground px-1.5 py-0.5 bg-muted rounded">{startRecord}-{endRecord}</span>
                        <span>{t('of')}</span>
                        <span className="font-semibold text-foreground">{totalCount}</span>
                        <span>{t('records')}</span>
                    </div>
                ) : (
                    <span>{t('page')} {currentPage} {t('of')} {totalPages}</span>
                )}
            </div>
            <div className="flex items-center space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1 || isNavigating}
                >
                    {isNavigating ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                        <ChevronLeft className="h-4 w-4 mr-1" />
                    )}
                    {t('previous')}
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages || isNavigating}
                >
                    {t('next')}
                    {isNavigating ? (
                        <Loader2 className="h-4 w-4 ml-1 animate-spin" />
                    ) : (
                        <ChevronRight className="h-4 w-4 ml-1" />
                    )}
                </Button>
            </div>
        </div>
    )
}
