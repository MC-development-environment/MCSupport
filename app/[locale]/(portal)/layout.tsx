import { Link } from "@/i18n/routing";
import { ModeToggle } from "@/components/mode-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { auth } from "@/auth";
import { UserNav } from "@/components/portal/user-nav";
import { MobileNav } from "@/components/portal/mobile-nav";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="flex h-screen w-full flex-col overflow-y-auto bg-background">
      <header className="sticky top-0 z-30 border-b bg-background">
        <div className="flex h-14 items-center gap-4 px-4 sm:px-6 mx-auto max-w-7xl">
          <MobileNav />
          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/portal"
              className="flex flex-col items-start gap-0 hover:opacity-90 transition-opacity"
            >
              <span className="text-xl font-bold text-primary tracking-tight">
                MCSupport
              </span>
              <span className="h-1 w-2/3 bg-[#f97316] rounded-r-full" />
            </Link>
          </div>
          <div className="relative ml-auto flex-1 md:grow-0">
            {/* Search bar could go here */}
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ModeToggle />
            <UserNav user={session?.user || {}} />
          </div>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        {children}
      </main>
    </div>
  );
}
