"use client"

import { Dialog, DialogContent, DialogClose, DialogTitle } from "@/components/ui/dialog"
import { X, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useTranslations } from "next-intl"

interface ImageViewerProps {
    isOpen: boolean
    onClose: () => void
    imageUrl: string
    imageName: string
}

export function ImageViewer({ isOpen, onClose, imageUrl, imageName }: ImageViewerProps) {
    const t = useTranslations("ImageViewer");

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden border-0 [&>button]:hidden">
                {/* Título oculto para accesibilidad */}
                <DialogTitle className="sr-only">
                    {imageName}
                </DialogTitle>

                <div className="relative w-full h-[90vh] flex flex-col bg-black">
                    {/* Encabezado con botón de cerrar */}
                    <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black via-black/80 to-transparent">
                        <h3 className="text-white font-medium truncate max-w-[80%] text-sm">
                            {imageName}
                        </h3>
                        <DialogClose asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="text-white hover:bg-white/20 h-8 w-8"
                            >
                                <X className="h-5 w-5" />
                                <span className="sr-only">{t('close')}</span>
                            </Button>
                        </DialogClose>
                    </div>

                    {/* Contenedor de imagen */}
                    <div className="relative w-full h-full flex items-center justify-center">
                        <Image
                            src={imageUrl}
                            alt={imageName}
                            fill
                            className="object-contain p-16"
                            sizes="90vw"
                            priority
                        />
                    </div>

                    {/* Botón de descarga */}
                    <div className="absolute bottom-0 left-0 right-0 z-50 flex items-center justify-center p-6 bg-gradient-to-t from-black via-black/80 to-transparent">
                        <Button
                            asChild
                            variant="secondary"
                            className="gap-2"
                        >
                            <a
                                href={imageUrl}
                                download={imageName}
                            >
                                <Download className="h-4 w-4" />
                                {t('download')}
                            </a>
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
