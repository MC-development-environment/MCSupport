"use client"

import { UploadButton } from "./upload-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileIcon, Download, Eye } from "lucide-react"
import { format } from "date-fns"
import { useTranslations } from 'next-intl';
import { ImageViewer } from "./image-viewer"
import { useState } from "react"
import { Button } from "@/components/ui/button"

interface Attachment {
    id: string
    name: string
    url: string
    size: number
    createdAt: Date
    uploader: {
        name: string | null
        email: string
    }
}

export function AttachmentSection({ ticketId, attachments }: { ticketId: string, attachments: Attachment[] }) {
    const t = useTranslations("Admin.Attachments");
    const [selectedImage, setSelectedImage] = useState<{ url: string; name: string } | null>(null);

    const handleImageClick = (url: string, name: string) => {
        setSelectedImage({ url, name });
    };

    const handleCloseViewer = () => {
        setSelectedImage(null);
    };

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row flex-wrap items-center gap-4 pb-2">
                    <CardTitle className="text-sm font-medium">{t('title')}</CardTitle>
                    <div className="flex-1">
                        <UploadButton ticketId={ticketId} currentCount={attachments.length} />
                    </div>
                </CardHeader>
                <CardContent>
                    {attachments.length === 0 ? (
                        <p className="text-xs text-muted-foreground">{t('noFiles')}</p>
                    ) : (
                        <ul className="space-y-2">
                            {attachments.map((file) => (
                                <li key={file.id} className="flex items-center justify-between p-2 rounded border bg-muted/50">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <FileIcon className="h-4 w-4 shrink-0 text-primary" />
                                        <div className="grid gap-0.5">
                                            <span className="text-sm font-medium truncate max-w-[150px] sm:max-w-[200px]">
                                                {file.name}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {(file.size / 1024).toFixed(1)} KB • {format(file.createdAt, 'dd/MM/yy HH:mm')} • {file.uploader.name || file.uploader.email}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleImageClick(file.url, file.name)}
                                            className="text-muted-foreground hover:text-foreground"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <a href={file.url} download className="text-muted-foreground hover:text-foreground">
                                            <Download className="h-4 w-4" />
                                        </a>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>

            {selectedImage && (
                <ImageViewer
                    isOpen={!!selectedImage}
                    onClose={handleCloseViewer}
                    imageUrl={selectedImage.url}
                    imageName={selectedImage.name}
                />
            )}
        </>
    )
}
