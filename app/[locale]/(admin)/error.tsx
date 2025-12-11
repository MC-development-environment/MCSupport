'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

import { useTranslations } from 'next-intl';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const t = useTranslations('Error');

    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
            <h2 className="text-2xl font-bold text-destructive">{t('adminTitle')}</h2>
            <p className="text-muted-foreground">{error.message || t('unknown')}</p>
            {process.env.NODE_ENV === 'development' && error.digest && (
                <p className="text-xs text-mono text-muted-foreground">{t('digest')}: {error.digest}</p>
            )}
            <Button onClick={() => reset()}>{t('retry')}</Button>
        </div>
    );
}
