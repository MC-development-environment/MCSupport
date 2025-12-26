import { AdminSidebar, MobileSidebar } from "@/components/admin/sidebar"
import { ModeToggle } from "@/components/mode-toggle"
import { LanguageToggle } from "@/components/language-toggle"
import { GlobalSearch } from "@/components/admin/global-search"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

import { UserNav } from "@/components/admin/user-nav"

export default async function AdminLayout({
    children,
    params
}: {
    children: React.ReactNode
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params;

    let session = null;
    try {
        session = await auth();
    } catch (e) {
        console.error("Auth session failed:", e);
    }

    if (session?.user?.role === 'CLIENT' || session?.user?.role === 'VIRTUAL_ASSISTANT') {
        redirect(`/${locale}/portal`);
    }



    return (
        <div className="grid h-screen w-full md:grid-cols-[200px_1fr] lg:grid-cols-[240px_1fr] overflow-hidden">
            <AdminSidebar userRole={session?.user?.role} />
            <div className="flex flex-col h-full min-h-0 overflow-hidden">
                <header className="flex h-14 items-center gap-2 md:gap-4 border-b bg-muted/40 px-4 sm:px-6 lg:h-[60px]">
                    <MobileSidebar userRole={session?.user?.role} />
                    <div className="w-full flex-1">
                        <GlobalSearch />
                    </div>
                    <LanguageToggle />
                    <ModeToggle />
                    <UserNav user={session?.user || {}} />
                </header>
                <main className="flex-1 overflow-y-auto p-4 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
