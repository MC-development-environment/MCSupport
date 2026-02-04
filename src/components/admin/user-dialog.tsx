"use client"

import React, { useState } from "react"
import { User } from "@prisma/client"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useTranslations } from "next-intl"
import { Plus } from "lucide-react"
import { UserForm } from "./user-form"

interface Props {
    user?: Partial<User> & { skills?: string }; // habilidades como cadena separada por comas
    departments: { id: string, name: string }[];
    catalogSkills?: { id: string, name: string }[]; // Habilidades disponibles del catálogo
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
}

export function UserDialog({ user, departments, catalogSkills = [], trigger }: Props) {
    const t = useTranslations('Admin.Users');
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button><Plus className="mr-2 h-4 w-4" /> {t('create')}</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{user ? t('edit') : t('create')}</DialogTitle>
                    <DialogDescription>
                        {user ? t('UserDialog.editDescription') : t('UserDialog.createDescription')}
                    </DialogDescription>
                </DialogHeader>
                {/* Lazy load Form only when dialog is open */}
                {open && (
                    <UserForm 
                        user={user} 
                        departments={departments} 
                        catalogSkills={catalogSkills}
                        onSuccess={() => setOpen(false)}
                    />
                )}
            </DialogContent>
        </Dialog>
    )
}

