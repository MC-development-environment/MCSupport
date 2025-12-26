
"use client"

import { Input } from "@/components/ui/input"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useState, useRef, useMemo } from "react"
import { useFilterLoading } from "@/contexts/filter-loading-context"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

// Traducciones de nombres de departamento
const DEPARTMENT_LABELS: Record<string, { es: string; en: string }> = {
    'Support': { es: 'Soporte', en: 'Support' },
    'Development': { es: 'Desarrollo', en: 'Development' },
    'Consulting': { es: 'Consultoría', en: 'Consulting' },
    'Infrastructure': { es: 'Infraestructura', en: 'Infrastructure' },
    'Networks': { es: 'Redes', en: 'Networks' },
    'Accounting': { es: 'Contabilidad', en: 'Accounting' },
    'Application': { es: 'Aplicaciones', en: 'Application' },
    'Service': { es: 'Servicio', en: 'Service' },
};

function getDeptLabel(name: string, locale: string): string {
    const labels = DEPARTMENT_LABELS[name];
    return labels ? labels[locale as 'es' | 'en'] : name;
}

interface User {
    id: string
    name: string | null
    email: string
}

interface Department {
    id: string
    name: string
    users: User[]
}

interface TicketFiltersProps {
    departments?: Department[]
}

export function TicketFilters({ departments = [] }: TicketFiltersProps) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();
    const t = useTranslations('Admin');
    const [term, setTerm] = useState(searchParams.get('query')?.toString() || '');
    const [department, setDepartment] = useState(searchParams.get('department')?.toString() || 'all');
    const [assignee, setAssignee] = useState(searchParams.get('assignee')?.toString() || 'all');
    const isInitialMount = useRef(true);
    const { startTransition } = useFilterLoading();

    // Detectar locale desde pathname
    const locale = pathname.startsWith('/en') ? 'en' : 'es';

    // Filtrar asignados basado en departamento seleccionado
    const filteredAssignees = useMemo(() => {
        if (department === 'all') {
            // Retornar todos los usuarios de todos los departamentos
            return departments.flatMap(d => d.users);
        }
        const selectedDept = departments.find(d => d.id === department);
        return selectedDept?.users || [];
    }, [department, departments]);

    useEffect(() => {
        // Saltar efecto en montaje inicial para evitar navegación innecesaria
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const timeoutId = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString());
            if (term) {
                params.set('query', term);
                params.delete('page'); // Reiniciar a página 1 al buscar
            } else {
                params.delete('query');
            }
            startTransition(() => {
                router.replace(`${pathname}?${params.toString()}`);
            });
        }, 300);

        return () => clearTimeout(timeoutId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [term, router, pathname]);

    const handleDepartmentChange = (value: string) => {
        setDepartment(value);
        setAssignee('all'); // Reiniciar asignado cuando cambia el departamento
        const params = new URLSearchParams(searchParams.toString());
        if (value && value !== 'all') {
            params.set('department', value);
        } else {
            params.delete('department');
        }
        params.delete('assignee'); // Limpiar filtro de asignado cuando cambia el departamento
        params.delete('page');
        startTransition(() => {
            router.replace(`${pathname}?${params.toString()}`);
        });
    };

    const handleAssigneeChange = (value: string) => {
        setAssignee(value);
        const params = new URLSearchParams(searchParams.toString());
        if (value && value !== 'all') {
            params.set('assignee', value);
        } else {
            params.delete('assignee');
        }
        params.delete('page');
        startTransition(() => {
            router.replace(`${pathname}?${params.toString()}`);
        });
    };

    return (
        <div className="flex items-center w-full max-w-2xl gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[150px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder={t('searchPlaceholder')}
                    onChange={(e) => setTerm(e.target.value)}
                    value={term}
                    className="pl-8"
                />
            </div>
            {departments.length > 0 && (
                <Select value={department} onValueChange={handleDepartmentChange}>
                    <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder={locale === 'es' ? 'Departamento' : 'Department'} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{locale === 'es' ? 'Todos' : 'All'}</SelectItem>
                        {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                                {getDeptLabel(dept.name, locale)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}
            <Select value={assignee} onValueChange={handleAssigneeChange}>
                <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder={locale === 'es' ? 'Asignado a' : 'Assigned to'} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">{locale === 'es' ? 'Todos' : 'All'}</SelectItem>
                    <SelectItem value="unassigned">{locale === 'es' ? 'Sin asignar' : 'Unassigned'}</SelectItem>
                    {filteredAssignees.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                            {user.name || user.email}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}

