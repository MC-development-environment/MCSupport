
"use client"

import { Input } from "@/components/ui/input"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useState, useRef } from "react"

export function TicketFilters() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();
    const t = useTranslations('Admin');
    const [term, setTerm] = useState(searchParams.get('query')?.toString() || '');
    const isInitialMount = useRef(true);

    useEffect(() => {
        // Skip the effect on initial mount to prevent unnecessary navigation
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const timeoutId = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString());
            if (term) {
                params.set('query', term);
                params.delete('page'); // Reset to page 1 when searching
            } else {
                params.delete('query');
            }
            replace(`${pathname}?${params.toString()}`);
        }, 300);

        return () => clearTimeout(timeoutId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [term, replace, pathname]); // Removed searchParams from dependencies

    return (
        <div className="flex items-center w-full max-w-sm gap-2">
            <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar ticket..."
                    onChange={(e) => setTerm(e.target.value)}
                    value={term}
                    className="pl-8"
                />
            </div>
        </div>
    )
}
