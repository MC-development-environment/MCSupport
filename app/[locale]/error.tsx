'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { logger } from '@/lib/logger';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const t = useTranslations('Error');

    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
            <Card className="w-full max-w-md shadow-lg border-red-200 dark:border-red-900">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-red-100 dark:bg-red-900/30 p-3 rounded-full w-fit mb-4">
                        <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                    </div>
                    <CardTitle className="text-xl text-red-700 dark:text-red-400">
                        {t('adminTitle')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground">
                    <p>{error.message || t('unknown')}</p>
                    {error.digest && (
                        <p className="mt-2 text-xs text-gray-400">
                            {t('digest')}: {error.digest}
                        </p>
                    )}
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Button onClick={reset} variant="default" className="w-full sm:w-auto">
                        {t('retry')}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
