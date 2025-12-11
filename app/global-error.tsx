'use client';

import { useEffect } from 'react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <html>
            <body className="flex min-h-screen items-center justify-center bg-gray-50 p-4 font-sans text-gray-900">
                <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-xl text-center">
                    <h2 className="mb-4 text-2xl font-bold text-red-600">Critical Error</h2>
                    <p className="mb-6 text-gray-600">
                        Something went critically wrong.
                    </p>
                    <button
                        onClick={() => reset()}
                        className="rounded bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
                    >
                        Try again
                    </button>
                </div>
            </body>
        </html>
    );
}
