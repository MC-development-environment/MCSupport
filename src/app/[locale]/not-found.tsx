import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
    const t = useTranslations('Error');

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center space-y-4">
            <div className="bg-muted p-6 rounded-full">
                <FileQuestion className="h-16 w-16 text-muted-foreground" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">{t('pageNotFound')}</h1>
            <p className="text-muted-foreground max-w-md">
                {t('pageNotFoundDesc')}
            </p>
            <Button asChild className="mt-4">
                <Link href="/">{t('backHome')}</Link>
            </Button>
        </div>
    );
}
