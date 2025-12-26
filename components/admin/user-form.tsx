"use client"

import React, { useState, useTransition, useMemo, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { User, UserRole } from "@prisma/client"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { upsertUser } from "@/actions/user-actions"
import { toast } from "sonner"
import { useTranslations } from "next-intl"
import { X } from "lucide-react"
import { DialogFooter } from "@/components/ui/dialog"

// Obtener todos los valores de rol del enum de Prisma
const roles = Object.values(UserRole) as [UserRole, ...UserRole[]];

const FormSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1),
    email: z.string().email(),
    role: z.enum(roles),
    departmentId: z.string().nullable().optional(),
    password: z.string().optional(),
    skills: z.string().optional(), // Habilidades separadas por coma
})

interface UserFormProps {
    user?: Partial<User> & { skills?: string };
    departments: { id: string, name: string }[];
    catalogSkills?: { id: string, name: string }[];
    onSuccess: () => void;
}

export function UserForm({ user, departments, catalogSkills = [], onSuccess }: UserFormProps) {
    const t = useTranslations('Admin.Users');
    const [isPending, startTransition] = useTransition();
    const [skillInput, setSkillInput] = useState("");
    const [selectedSkills, setSelectedSkills] = useState<string[]>(
        user?.skills ? user.skills.split(',').map(s => s.trim()).filter(Boolean) : []
    );

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            id: user?.id,
            name: user?.name || "",
            email: user?.email || "",
            role: user?.role || UserRole.CLIENT,
            departmentId: user?.departmentId || undefined,
            password: "",
            skills: user?.skills || "",
        }
    })

    const watchedRole = form.watch('role');

    // Reset department if role is CLIENT
    useEffect(() => {
        if (watchedRole === 'CLIENT') {
            form.setValue('departmentId', "none");
        }
    }, [watchedRole, form]);

    const filteredSuggestions = useMemo(() => {
        const available = catalogSkills.filter(s => !selectedSkills.includes(s.name));
        if (!skillInput.trim()) return available.slice(0, 10);
        const lower = skillInput.toLowerCase();
        return available
            .filter(s => s.name.toLowerCase().includes(lower))
            .slice(0, 8);
    }, [skillInput, catalogSkills, selectedSkills]);

    const addSkill = (skillName: string) => {
        const trimmed = skillName.trim().toLowerCase();
        if (trimmed && !selectedSkills.includes(trimmed)) {
            const newSkills = [...selectedSkills, trimmed];
            setSelectedSkills(newSkills);
            form.setValue('skills', newSkills.join(', '));
        }
        setSkillInput("");
    };

    const removeSkill = (skillName: string) => {
        const newSkills = selectedSkills.filter(s => s !== skillName);
        setSelectedSkills(newSkills);
        form.setValue('skills', newSkills.join(', '));
    };

    const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (skillInput.trim()) {
                addSkill(skillInput);
            }
        }
    };

    function onSubmit(values: z.infer<typeof FormSchema>) {
        startTransition(async () => {
            const res = await upsertUser(values);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success(user ? t('UserDialog.updated') : t('UserDialog.created'));
                onSuccess();
            }
        })
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('name')}</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('email')}</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{user ? t('UserDialog.passwordOptional') : t('UserDialog.passwordLabel')}</FormLabel>
                            <FormControl>
                                <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('role')}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('UserDialog.selectRole')} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {roles.map(role => (
                                        <SelectItem key={role} value={role}>{role}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="departmentId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('department')}</FormLabel>
                            <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value || undefined}
                                disabled={watchedRole === 'CLIENT'}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('UserDialog.selectDepartment')} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="none">{t('UserDialog.none')}</SelectItem>
                                    {departments.map(d => (
                                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                {watchedRole !== 'CLIENT' && (
                    <FormField
                        control={form.control}
                        name="skills"
                        render={() => (
                            <FormItem>
                                <FormLabel>{t('UserDialog.skills') || 'Skills'}</FormLabel>
                                {selectedSkills.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-3 p-2 bg-muted/50 rounded-md border">
                                        {selectedSkills.map(skill => (
                                            <Badge 
                                                key={skill} 
                                                variant="default"
                                                className="gap-1 pr-1.5 py-1 px-2.5 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90"
                                            >
                                                {skill}
                                                <button
                                                    type="button"
                                                    onClick={() => removeSkill(skill)}
                                                    className="ml-1.5 hover:bg-primary-foreground/20 rounded-full p-0.5 transition-colors"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                                <div className="relative">
                                    <FormControl>
                                        <Input 
                                            placeholder={t('UserDialog.skillsPlaceholder') || 'Type skill and press Enter...'}
                                            value={skillInput}
                                            onChange={(e) => setSkillInput(e.target.value)}
                                            onKeyDown={handleSkillKeyDown}
                                        />
                                    </FormControl>
                                    {skillInput && filteredSuggestions.length > 0 && (
                                        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-40 overflow-y-auto">
                                            {filteredSuggestions.map(skill => (
                                                <button
                                                    key={skill.id}
                                                    type="button"
                                                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                                                    onClick={() => addSkill(skill.name)}
                                                >
                                                    {skill.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {t('UserDialog.skillsHint') || 'Type skill name and press Enter. Select from suggestions or add new.'}
                                </p>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
                <DialogFooter>
                    <Button type="submit" disabled={isPending}>{t('save')}</Button>
                </DialogFooter>
            </form>
        </Form>
    )
}
