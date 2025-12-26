"use client"

import { useState, useEffect } from "react"

import { Link, usePathname } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    Ticket,
    BookOpen,
    Settings,
    Menu,
    LogOut,
    FileText,
    Users
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetTitle,
} from "@/components/ui/sheet"
import { signOut } from "next-auth/react"

export interface SidebarProps {
    userRole?: string
}

export function AdminSidebar({ userRole }: SidebarProps) {
    const pathname = usePathname();
    const t = useTranslations('Admin');

    const sidebarLinks = [
        { href: "/admin", label: t('dashboard'), icon: LayoutDashboard },
        { href: "/admin/dashboard/my-work", label: "My Work", icon: Ticket }, // TODO: Agregar clave de traducción luego si es necesario o codificar por ahora
        { href: "/admin/tickets", label: t('tickets'), icon: Ticket },
        { href: "/admin/kb", label: t('kb'), icon: BookOpen },
        { href: "/admin/reports", label: t('reports'), icon: FileText },
        { href: "/admin/users", label: t('users'), icon: Users, role: 'MANAGER' },
        { href: "/admin/settings", label: t('settings'), icon: Settings },
    ]

    const filteredLinks = sidebarLinks.filter(link => !link.role || link.role === userRole);

    const tLayout = useTranslations('Layout');

    return (
        <div className="hidden border-r bg-muted/40 md:block h-full">
            <div className="flex h-full flex-col gap-2">
                <div className="flex h-14 items-center px-4 lg:h-[60px] lg:px-6">
                    <Link href="/" className="flex flex-col items-start gap-0 font-semibold hover:opacity-90 transition-opacity">
                        <span className="text-xl font-bold text-primary tracking-tight">MCSupport</span>
                        <span className="h-1 w-2/3 bg-[#f97316] rounded-r-full" />
                    </Link>
                </div>
                <div className="flex-1 overflow-y-auto py-2">
                    <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-1 mt-4">
                        {filteredLinks.map((link) => {
                            const isActive = pathname === link.href || (link.href !== '/admin' && pathname.startsWith(link.href));
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                                        isActive ? "bg-muted text-primary" : "text-muted-foreground"
                                    )}
                                >
                                    <link.icon className="h-4 w-4" />
                                    {link.label}
                                </Link>
                            )
                        })}
                    </nav>
                </div>
                <div className="mt-auto p-4 pb-6">
                    <Button variant="outline" className="w-full justify-start gap-2" onClick={() => signOut()}>
                        <LogOut className="h-4 w-4" />
                        {tLayout('logout')}
                    </Button>
                </div>
            </div>
        </div>
    )
}

export function MobileSidebar({ userRole }: SidebarProps) {
    const pathname = usePathname();
    const t = useTranslations('Admin');
    const [open, setOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line
        setIsMounted(true);
    }, []);

    const sidebarLinks = [
        { href: "/admin", label: t('dashboard'), icon: LayoutDashboard },
        { href: "/admin/tickets", label: t('tickets'), icon: Ticket },
        { href: "/admin/kb", label: t('kb'), icon: BookOpen },
        { href: "/admin/reports", label: t('reports'), icon: FileText },
        { href: "/admin/users", label: t('users'), icon: Users, role: 'MANAGER' },
        { href: "/admin/settings", label: t('settings'), icon: Settings },
    ]

    const filteredLinks = sidebarLinks.filter(link => !link.role || link.role === userRole);

    if (!isMounted) {
        return null;
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0 md:hidden"
                >
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle navigation menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <nav className="grid gap-2 text-lg font-medium">
                    <Link
                        href="/"
                        className="flex flex-col items-start gap-0 font-semibold mb-4 hover:opacity-90 transition-opacity"
                    >
                        <span className="text-xl font-bold text-primary tracking-tight">MCSupport</span>
                        <span className="h-1 w-2/3 bg-[#f97316] rounded-r-full" />
                    </Link>
                    {filteredLinks.map((link) => {
                        const isActive = pathname === link.href || (link.href !== '/admin' && pathname.startsWith(link.href));
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setOpen(false)}
                                className={cn(
                                    "mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 hover:text-foreground",
                                    isActive ? "bg-muted text-foreground" : "text-muted-foreground"
                                )}
                            >
                                <link.icon className="h-5 w-5" />
                                {link.label}
                            </Link>
                        )
                    })}
                </nav>
            </SheetContent>
        </Sheet>
    )
}
