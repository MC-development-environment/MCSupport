"use client"

import { useState, useEffect } from "react";
import { initiate2FA, enable2FA, disable2FA, get2FAStatus } from "@/actions/two-factor-actions";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, ShieldCheck, Copy, Download } from "lucide-react";
import { useTranslations } from "next-intl";

type SetupStep = 'status' | 'scan' | 'verify' | 'backup' | 'complete';

export function TwoFactorSetup() {
    const t = useTranslations('TwoFactor');
    
    const [step, setStep] = useState<SetupStep>('status');
    const [secret, setSecret] = useState('');
    const [qrCode, setQRCode] = useState('');
    const [token, setToken] = useState('');
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isEnabled, setIsEnabled] = useState(false);
    const [backupCodesCount, setBackupCodesCount] = useState(0);
    const [disablePassword, setDisablePassword] = useState('');

    // Cargar estado inicial
    useEffect(() => {
        const loadStatus = async () => {
            const result = await get2FAStatus();
            if (result.success) {
                setIsEnabled(result.enabled!);
                setBackupCodesCount(result.backupCodesRemaining!);
            }
        };
        loadStatus();
    }, []);

    const handleInitiate = async () => {
        setLoading(true);
        setError('');
        
        const result = await initiate2FA();
        setLoading(false);

        if (result.error) {
            setError(result.error);
            return;
        }

        setSecret(result.secret!);
        setQRCode(result.qrCodeDataUrl!);
        setStep('scan');
    };

    const handleVerify = async () => {
        if (token.length !== 6) {
            setError(t('errors.invalidCode'));
            return;
        }

        setLoading(true);
        setError('');
        
        const result = await enable2FA(secret, token);
        setLoading(false);

        if (result.error) {
            setError(result.error);
            return;
        }

        setBackupCodes(result.backupCodes!);
        setStep('backup');
    };

    const handleDisable = async () => {
        if (!disablePassword) {
            setError(t('errors.passwordIncorrect'));
            return;
        }

        setLoading(true);
        setError('');
        
        const result = await disable2FA(disablePassword);
        setLoading(false);

        if (result.error) {
            setError(result.error);
            return;
        }

        setIsEnabled(false);
        setStep('status');
        setDisablePassword('');
    };

    const copySecret = () => {
        navigator.clipboard.writeText(secret);
    };

    const downloadBackupCodes = () => {
        const text = `MC Support - ${t('backupCodesRemaining')}\n\n${backupCodes.join('\n')}\n\n${t('backup.description')}`;
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mc-support-backup-codes.txt';
        a.click();
    };

    if (step === 'complete' || (step === 'status' && isEnabled)) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-green-600" />
                        {t('title')}
                    </CardTitle>
                    <CardDescription>
                        {t('active.description')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-green-800">
                            <CheckCircle2 className="w-5 h-5" />
                            <span className="font-medium">{t('active.title')}</span>
                        </div>
                        <p className="text-sm text-green-700 mt-1">
                            {t('active.description')}
                        </p>
                    </div>

                    {backupCodesCount > 0 && (
                        <Alert>
                            <AlertDescription>
                                {t('backupCodesRemaining')}: <strong>{backupCodesCount}</strong>
                            </AlertDescription>
                        </Alert>
                    )}

                    {backupCodesCount === 0 && (
                        <Alert variant="destructive">
                            <AlertDescription>
                                ⚠️ {t('errors.notEnabled')}
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="border-t pt-4">
                        <h4 className="font-medium mb-2">{t('active.disableTitle')}</h4>
                        <p className="text-sm text-gray-600 mb-3">
                            {t('active.disableDesc')}
                        </p>
                        <div className="flex gap-2">
                            <Input
                                type="password"
                                placeholder={t('active.passwordPlaceholder')}
                                value={disablePassword}
                                onChange={(e) => setDisablePassword(e.target.value)}
                            />
                            <Button 
                                variant="destructive" 
                                onClick={handleDisable}
                                disabled={loading}
                            >
                                {loading ? t('active.disabling') : t('disable')}
                            </Button>
                        </div>
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>
        );
    }

    if (step === 'backup') {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>✅ {t('backup.title')}</CardTitle>
                    <CardDescription>
                        {t('backup.subtitle')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert>
                        <AlertDescription>
                            <strong>⚠️ {t('backup.warning')}</strong> {t('backup.description')}
                        </AlertDescription>
                    </Alert>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                            {backupCodes.map((code, i) => (
                                <div key={i} className="bg-white p-2 rounded border text-center">
                                    {code}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button 
                            onClick={downloadBackupCodes}
                            variant="outline"
                            className="flex-1"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            {t('backup.download')}
                        </Button>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button 
                        onClick={() => {
                            setStep('complete');
                            setIsEnabled(true);
                            setBackupCodesCount(backupCodes.length);
                        }}
                        className="w-full"
                    >
                        {t('backup.finish')}
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    if (step === 'scan') {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{t('scan.title')}</CardTitle>
                    <CardDescription>
                        {t('scan.subtitle')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-center">
                        <div className="bg-white p-4 rounded-lg border">
                            <Image 
                                src={qrCode} 
                                alt="QR Code 2FA" 
                                width={256} 
                                height={256}
                                priority
                            />
                        </div>
                    </div>

                    <div className="text-center">
                        <p className="text-sm text-gray-600 mb-2">
                            {t('scan.cantScan')}
                        </p>
                        <div className="flex items-center justify-center gap-2">
                            <code className="bg-gray-100 px-3 py-2 rounded font-mono text-sm">
                                {secret}
                            </code>
                            <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={copySecret}
                            >
                                <Copy className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    <Alert>
                        <AlertDescription className="text-sm">
                            {t('scan.apps')}<br />
                            • Google Authenticator<br />
                            • Microsoft Authenticator<br />
                            • Authy
                        </AlertDescription>
                    </Alert>
                </CardContent>
                <CardFooter>
                    <Button 
                        onClick={() => setStep('verify')}
                        className="w-full"
                    >
                        {t('scan.continue')} →
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    if (step === 'verify') {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{t('verify.title')}</CardTitle>
                    <CardDescription>
                        {t('verify.subtitle')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Input
                            type="text"
                            value={token}
                            onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            maxLength={6}
                            placeholder={t('verify.placeholder')}
                            className="text-center text-2xl font-mono tracking-wider"
                            autoFocus
                        />
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                </CardContent>
                <CardFooter className="flex gap-2">
                    <Button 
                        variant="outline"
                        onClick={() => setStep('scan')}
                        className="flex-1"
                    >
                        ← {t('verify.back')}
                    </Button>
                    <Button 
                        onClick={handleVerify}
                        disabled={loading || token.length !== 6}
                        className="flex-1"
                    >
                        {loading ? t('verify.submitting') : t('verify.submit')}
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    // Pantalla de estado inicial (status === 'status' && !isEnabled)
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5" />
                    {t('title')}
                </CardTitle>
                <CardDescription>
                    {t('subtitle')}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                    {t('subtitle')}
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">{t('benefits')}</h4>
                    <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                        <li>{t('benefitsList.protection')}</li>
                        <li>{t('benefitsList.secure')}</li>
                        <li>{t('benefitsList.compatible')}</li>
                        <li>{t('benefitsList.backup')}</li>
                    </ul>
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
            </CardContent>
            <CardFooter>
                <Button 
                    onClick={handleInitiate}
                    disabled={loading}
                    className="w-full"
                >
                    {loading ? t('verify.submitting') : t('enable')}
                </Button>
            </CardFooter>
        </Card>
    );
}
