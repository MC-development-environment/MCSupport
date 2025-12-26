import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/auth';
import { logout } from "@/actions/auth-actions"
import { ModeToggle } from "@/components/mode-toggle"
import { LanguageToggle } from "@/components/language-toggle"

export default async function IndexPage() {
  const t = await getTranslations('Index');
  const tNav = await getTranslations('Navigation');
  const session = await auth();

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
      <div className="absolute right-4 top-4 flex items-center gap-2 md:right-8 md:top-8">
        <LanguageToggle />
        <ModeToggle />
      </div>
      <div className="z-10 w-full max-w-md space-y-8 rounded-lg border bg-card p-6 shadow-sm">
        <div className="flex flex-col items-center justify-center text-center">
          <h1 className="text-3xl font-bold tracking-tight text-primary">MCSupport</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('title')}</p>
        </div>

        <div className="grid gap-4">
          {session ? (
            <div className="text-center space-y-4">
              <p className="text-sm">{t('loggedInAs')} {session.user?.email}</p>
              <div className={`grid gap-4 ${session.user?.role !== 'CLIENT' && session.user?.role !== 'VIRTUAL_ASSISTANT' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {session.user?.role !== 'CLIENT' && session.user?.role !== 'VIRTUAL_ASSISTANT' && (
                  <Link href="/admin" className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 flex items-center justify-center">
                    {tNav('admin')}
                  </Link>
                )}
                <Link href="/portal" className={`rounded-md px-4 py-2 flex items-center justify-center ${session.user?.role === 'CLIENT' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
                  {tNav('portal')}
                </Link>
              </div>
              <form action={logout}>
                <button type="submit" className="text-sm text-destructive mt-2">
                  {tNav('logout') || "Cerrar Sesión"}
                </button>
              </form>
            </div>
          ) : (
            <Link href="/login" className="w-full rounded-md bg-primary px-4 py-2 text-center text-primary-foreground hover:bg-primary/90">
              Iniciar Sesión
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
