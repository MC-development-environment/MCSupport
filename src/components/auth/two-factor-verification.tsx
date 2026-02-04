"use client"

import { useState } from "react";
import { verify2FACode } from "@/common/actions/two-factor-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";

interface TwoFactorVerificationProps {
    userId: string;
    onSuccess: () => void;
    onCancel?: () => void;
    onVerify?: (code: string) => Promise<{ error?: string; warning?: string }>;
}

export function TwoFactorVerification({ userId, onSuccess, onCancel, onVerify }: TwoFactorVerificationProps) {
    const t = useTranslations('TwoFactor.login');
    const tError = useTranslations('TwoFactor.errors');
    
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [useBackupCode, setUseBackupCode] = useState(false);

    const handleVerify = async () => {
        if (!token || token.length < 6) {
            setError(tError('invalidCode'));
            return;
        }

        setLoading(true);
        setError('');
        
        // Usar verificador personalizado si se provee (para flujo de login), si no acción por defecto
        const result = onVerify 
            ? await onVerify(token)
            : await verify2FACode(userId, token);
            
        setLoading(false);

        if (result.error) {
            setError(result.error);
            return;
        }

        // Mostrar advertencia si fue el último código de respaldo
        if (result.warning) {
            alert(result.warning);
        }

        onSuccess();
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && token.length >= 6) {
            handleVerify();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-blue-600" />
                        {t('title')}
                    </CardTitle>
                    <CardDescription>
                        {useBackupCode ? t('subtitleBackup') : t('subtitle')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Input
                            type="text"
                            value={token}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\s/g, '');
                                if (useBackupCode) {
                                    // Código de respaldo: XXXX-XXXX (8 caracteres hex)
                                    setToken(value.toUpperCase().slice(0, 8));
                                } else {
                                    // TOTP: 6 dígitos
                                    setToken(value.replace(/\D/g, '').slice(0, 6));
                                }
                            }}
                            onKeyPress={handleKeyPress}
                            placeholder={useBackupCode ? t('placeholderBackup') : t('placeholder')}
                            className={`text-center ${useBackupCode ? 'text-xl font-mono' : 'text-2xl font-mono tracking-wider'}`}
                            autoFocus
                            autoComplete="off"
                        />
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={() => {
                                setUseBackupCode(!useBackupCode);
                                setToken('');
                                setError('');
                            }}
                            className="text-sm text-blue-600 hover:underline"
                        >
                            {useBackupCode ? t('useAuthenticator') : t('useBackup')}
                        </button>
                    </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                    {onCancel && (
                        <Button 
                            variant="outline"
                            onClick={onCancel}
                            className="flex-1"
                            disabled={loading}
                        >
                            {t('cancel')}
                        </Button>
                    )}
                    <Button
                        onClick={handleVerify}
                        disabled={loading || token.length < (useBackupCode ? 8 : 6)}
                        className="flex-1"
                    >
                        {loading ? t('verifying') : t('verify')}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
