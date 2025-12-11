import { Link } from '@/i18n/routing';
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Package2, LogOut } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"
import { LanguageToggle } from "@/components/language-toggle"
import { logout } from "@/actions/auth-actions"
import { getTranslations } from "next-intl/server"

export default async function PortalLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const t = await getTranslations('Navigation');
    return (
        <div className="flex h-screen w-full flex-col overflow-y-auto bg-background">
            <header className="sticky top-0 z-30 border-b bg-background">
                <div className="flex h-14 items-center gap-4 px-4 sm:px-6 mx-auto max-w-7xl">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button size="icon" variant="outline" className="sm:hidden">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle Menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="sm:max-w-xs">
                            <nav className="grid gap-6 text-lg font-medium">
                                <Link
                                    href="#"
                                    className="group flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
                                >
                                    <Package2 className="h-5 w-5 transition-all group-hover:scale-110" />
                                    <span className="sr-only">Multicomputos</span>
                                </Link>
                                <Link
                                    href="/portal"
                                    className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                                >
                                    Home
                                </Link>
                                <Link
                                    href="/portal/tickets"
                                    className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                                >
                                    My Tickets
                                </Link>
                                <Link
                                    href="/portal/kb"
                                    className="flex items-center gap-4 px-2.5 text-foreground"
                                >
                                    Knowledge Base
                                </Link>
                            </nav>
                        </SheetContent>
                    </Sheet>
                    <div className="hidden md:flex items-center gap-2">
                        <Link href="/portal" className="flex flex-col items-start gap-0 hover:opacity-90 transition-opacity">
                            <span className="text-xl font-bold text-primary tracking-tight">MCSupport</span>
                            <span className="h-1 w-2/3 bg-[#f97316] rounded-r-full" />
                        </Link>
                    </div>
                    <div className="relative ml-auto flex-1 md:grow-0">
                        {/* Search bar could go here */}
                    </div>
                    <div className="flex items-center gap-2">
                        <LanguageToggle />
                        <ModeToggle />
                        <form action={logout}>
                            <Button variant="ghost" size="icon" title={t('logout')}>
                                <LogOut className="h-5 w-5" />
                                <span className="sr-only">{t('logout')}</span>
                            </Button>
                        </form>
                    </div>
                </div>
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
                {children}
            </main>
        </div>
    )
}
