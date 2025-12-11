import { ClientLoginForm } from "@/components/portal/client-login-form"
import { Link } from '@/i18n/routing';
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ClientLoginPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 space-y-8">
            <Button asChild variant="ghost" className="absolute left-4 top-20 md:left-8 md:top-24">
                <Link href="/" className="flex items-center gap-2">
                    <ChevronLeft className="h-4 w-4" />
                    Inicio
                </Link>
            </Button>

            <div className="w-full max-w-sm space-y-6">
                <ClientLoginForm />
            </div>
        </div>
    )
}
