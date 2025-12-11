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

            // Get all image files
            const imageFiles = formData.getAll('images') as File[];

            // Remove original images from formData
            formData.delete('images');

            // Compress images before upload
            if (imageFiles.length > 0 && imageFiles.some(f => f.size > 0)) {
                toast.info('Optimizando imágenes...');
            }

            const compressionOptions = {
                maxSizeMB: 10, // Max size per file still 10MB
                maxWidthOrHeight: 1920, // Reasonable max dimension
                useWebWorker: true,
                quality: 0.85, // 85% quality - good balance
            };

            for (const file of imageFiles) {
                if (file.size > 0 && file.name !== 'undefined') {
                    try {
                        // Only compress if it's an image
                        if (file.type.startsWith('image/')) {
                            const compressedFile = await imageCompression(file, compressionOptions);
                            formData.append('images', compressedFile, file.name);
                        } else {
                            formData.append('images', file);
                        }
                    } catch (err) {
                        console.error(`Error compressing ${file.name}:`, err);
                        // If compression fails, use original file
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
                toast.error(result.error || 'Error creating ticket');
                return;
            }

            toast.success(t('success'));

            // Redirect to ticket detail
            if (result.ticketId) {
                router.push(`/portal/tickets/${result.ticketId}`);
            } else {
                router.push('/portal/tickets');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error creating ticket');
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

        // Validate size (10MB per file, 45MB total max to avoid server limit)
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

        if (totalSize > 20 * 1024 * 1024) {
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
                <p className="text-xs text-muted-foreground">
                    Máximo 10 imágenes. 10MB por archivo, 20MB total.
                </p>
            </div>

            <div className="flex items-center gap-4">
                <Button type="submit" disabled={isPending}>
                    {isPending ? t('submitting') : t('submit')}
                </Button>
            </div>
        </form>
    )
}
