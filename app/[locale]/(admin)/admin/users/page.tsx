import { getTranslations } from 'next-intl/server';
import { getUsers, getDepartments, deleteUser } from "@/actions/user-actions"
import { UserDialog } from "@/components/admin/user-dialog"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Edit, Trash2 } from "lucide-react"
import { RoleBadge } from "@/components/role-badge"

import { auth } from "@/auth"
import { redirect } from "next/navigation"

import { PaginationControls } from "@/components/pagination-controls"

export default async function UsersPage({
    searchParams,
}: {
    searchParams?: Promise<{
        page?: string;
    }>;
}) {
    const params = await searchParams;
    const page = Number(params?.page) || 1;
    const limit = 10;

    const session = await auth();
    if (session?.user?.role !== 'MANAGER') {
        redirect('/es/admin');
    }

    const t = await getTranslations('Admin.Users');
    const { users, totalCount, totalPages } = await getUsers(page, limit);
    const departments = await getDepartments();

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">{t('title')}</h1>
                    <p className="text-muted-foreground">Administración de acceso y roles del sistema.</p>
                </div>
                <UserDialog departments={departments} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Usuarios ({totalCount})</CardTitle>
                    <CardDescription>Lista completa de usuarios registrados.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('name')}</TableHead>
                                <TableHead>{t('email')}</TableHead>
                                <TableHead>{t('role')}</TableHead>
                                <TableHead>{t('department')}</TableHead>
                                <TableHead className="text-right">{t('actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <RoleBadge role={user.role} />
                                    </TableCell>
                                    <TableCell>
                                        {user.department?.name || "-"}
                                    </TableCell>
                                    <TableCell className="text-right flex justify-end gap-2">
                                        <UserDialog
                                            user={user}
                                            departments={departments}
                                            trigger={
                                                <Button size="icon" variant="ghost">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            }
                                        />
                                        {/* Implementation of Delete Button usually requires client component or form action. 
                                            For simplicity I omit functional delete button here or need a DeleteUserButton component.
                                            I'll leave it visual for now or create a small client component. */}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <PaginationControls
                        currentPage={page}
                        totalPages={totalPages}
                        baseUrl="/admin/users"
                    />
                </CardContent>
            </Card>
        </div>
    )
}
