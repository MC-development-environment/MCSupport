"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Paperclip } from "lucide-react"
import { useState } from "react"
import { useTranslations } from 'next-intl';
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import imageCompression from 'browser-image-compression';

export function TicketForm() {
    const t = useTranslations('Portal');
    const router = useRouter();
    const [fileCount, setFileCount] = useState(0);
    const [isPending, setIsPending] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsPending(true);

        try {
            const form = e.currentTarget;
            const formData = new FormData(form);

            // Obtener todos los archivos de imagen
            const imageFiles = formData.getAll('images') as File[];

            // Eliminar imágenes originales de formData
            formData.delete('images');

            // Comprimir imágenes antes de subir
            if (imageFiles.length > 0 && imageFiles.some(f => f.size > 0)) {
                toast.info('Optimizando imágenes...');
            }

            const compressionOptions = {
                maxSizeMB: 10, // Tamaño máx por archivo sigue siendo 10MB
                maxWidthOrHeight: 1920, // Dimensión máx razonable
                useWebWorker: true,
                quality: 0.85, // 85% calidad - buen balance
            };

            for (const file of imageFiles) {
                if (file.size > 0 && file.name !== 'undefined') {
                    try {
                        // Solo comprimir si es una imagen
                        if (file.type.startsWith('image/')) {
                            const compressedFile = await imageCompression(file, compressionOptions);
                            formData.append('images', compressedFile, file.name);
                        } else {
                            formData.append('images', file);
                        }
                    } catch (err) {
                        console.error(`Error compressing ${file.name}:`, err);
                        // Si compresión falla, usar archivo original
                        formData.append('images', file);
                    }
                }
            }

            const response = await fetch('/api/tickets', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                toast.error(result.error || 'Error al crear el ticket');
                return;
            }

            toast.success(t('success'));

            // Redireccionar a detalle del ticket
            if (result.ticketId) {
                router.push(`/portal/tickets/${result.ticketId}`);
            } else {
                router.push('/portal/tickets');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al crear el ticket');
        } finally {
            setIsPending(false);
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        if (files.length > 10) {
            toast.error(t('Attachments.limitReached'));
            e.target.value = "";
            setFileCount(0);
            return;
        }

        // Validar tamaño (10MB por archivo, 45MB total máx para evitar límite de servidor)
        let totalSize = 0;
        for (let i = 0; i < files.length; i++) {
            totalSize += files[i].size;
            if (files[i].size > 10 * 1024 * 1024) {
                toast.error(t('Attachments.sizeError'));
                e.target.value = "";
                setFileCount(0);
                return;
            }
        }

        if (totalSize > 30 * 1024 * 1024) {
            toast.error(t('Attachments.totalSizeError'));
            e.target.value = "";
            setFileCount(0);
            return;
        }

        setFileCount(files.length);
    };

    return (
        <form onSubmit={handleSubmit} className="grid gap-6">
            <div className="grid gap-3">
                <Label htmlFor="title">{t('subject')}</Label>
                <Input id="title" name="title" placeholder={t('subjectPlaceholder')} required />
            </div>

            <div className="grid gap-3">
                <Label htmlFor="priority">{t('priority')}</Label>
                <Select name="priority" defaultValue="LOW">
                    <SelectTrigger>
                        <SelectValue placeholder={t('selectPriority')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="LOW">{t('priorityLow')}</SelectItem>
                        <SelectItem value="MEDIUM">{t('priorityMedium')}</SelectItem>
                        <SelectItem value="HIGH">{t('priorityHigh')}</SelectItem>
                        <SelectItem value="CRITICAL">{t('priorityCritical')}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="grid gap-3">
                <Label htmlFor="description">{t('description')}</Label>
                <Textarea
                    id="description"
                    name="description"
                    className="min-h-[200px]"
                    placeholder={t('descriptionPlaceholder')}
                    required
                />
            </div>

            <div className="grid gap-3">
                <Label htmlFor="ccEmails">{t('ccEmails')}</Label>
                <Input
                    id="ccEmails"
                    name="ccEmails"
                    type="text"
                    placeholder={t('ccEmailsPlaceholder')}
                />
                <p className="text-xs text-muted-foreground">
                    {t('ccEmailsHint')}
                </p>
            </div>

            <div className="grid gap-3">
                <Label>{t('Attachments.title')}</Label>
                <div className="flex flex-col gap-2">
                    <Input
                        id="images"
                        name="images"
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                    <div className="flex items-center gap-4">
                        <label htmlFor="images">
                            <Button
                                type="button"
                                variant="outline"
                                asChild
                                className="cursor-pointer"
                            >
                                <span className="flex items-center gap-2">
                                    <Paperclip className="h-4 w-4" />
                                    <span>{t('Attachments.upload')}</span>
                                </span>
                            </Button>
                        </label>
                        {fileCount > 0 && (
                            <span className="text-sm text-muted-foreground">
                                {fileCount} archivo{fileCount !== 1 ? 's' : ''} seleccionado{fileCount !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-lg">
                    <svg className="w-4 h-4 mt-0.5 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span className="flex items-center gap-1.5">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                </svg>
                                <span className="font-medium">{t('Attachments.info.maxImages')}</span>
                            </span>
                            <span className="flex items-center gap-1.5">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <span>{t('Attachments.info.maxPerFile')}</span>
                            </span>
                            <span className="flex items-center gap-1.5">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
                                    <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
                                    <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
                                </svg>
                                <span>{t('Attachments.info.maxTotal')}</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <Button type="submit" disabled={isPending}>
                    {isPending ? t('submitting') : t('submit')}
                </Button>
            </div>
        </form>
    )
}
