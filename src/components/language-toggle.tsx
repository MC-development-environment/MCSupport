"use client"

import { Languages, Check } from "lucide-react"
import { usePathname, useRouter } from "@/common/i18n/routing"
import { useLocale } from "next-intl"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function LanguageToggle() {
    const router = useRouter()
    const pathname = usePathname()
    const locale = useLocale()

    const onSelectChange = (nextLocale: string) => {
        router.replace(pathname, { locale: nextLocale });
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                    <Languages className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">Toggle language</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem 
                    onClick={() => onSelectChange("en")} 
                    disabled={locale === 'en'}
                    className="flex items-center justify-between gap-3"
                >
                    <span>English</span>
                    {locale === 'en' && (
                        <Check className="h-4 w-4 text-primary" />
                    )}
                </DropdownMenuItem>
                <DropdownMenuItem 
                    onClick={() => onSelectChange("es")} 
                    disabled={locale === 'es'}
                    className="flex items-center justify-between gap-3"
                >
                    <span>Español</span>
                    {locale === 'es' && (
                        <Check className="h-4 w-4 text-primary" />
                    )}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

