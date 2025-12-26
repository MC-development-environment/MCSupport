import { getTranslations } from 'next-intl/server';
import { getUsers, getDepartments, getAllSkills } from "@/actions/user-actions"
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
import { Edit } from "lucide-react"
import { RoleBadge } from "@/components/role-badge"

import { auth } from "@/auth"
import { redirect } from "next/navigation"

import { PaginationControls } from "@/components/pagination-controls"
import { UserFilters } from "@/components/admin/user-filters"
import { SortableHeader } from "@/components/sortable-header"

export default async function UsersPage({
    searchParams,
}: {
    searchParams?: Promise<{
        page?: string;
        query?: string;
        sort?: string;
        order?: string;
    }>;
}) {
    const params = await searchParams;
    const page = Number(params?.page) || 1;
    const query = params?.query || '';
    const sort = params?.sort || 'name';
    const order = params?.order || 'asc';
    const limit = 10;

    const session = await auth();
    if (session?.user?.role !== 'MANAGER') {
        redirect('/es/admin');
    }

    const t = await getTranslations('Admin.Users');
    const { users, totalCount, totalPages } = await getUsers(page, limit, query, sort, order);
    const departments = await getDepartments();
    const catalogSkills = await getAllSkills();

    return (
        <div className="flex flex-1 flex-col gap-4 md:gap-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">{t('title')}</h1>
                    <p className="text-muted-foreground">{t('description')}</p>
                </div>
                <UserDialog departments={departments} catalogSkills={catalogSkills} />
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>{t('tableTitle')}</CardTitle>
                            <CardDescription>{t('usersList')}</CardDescription>
                        </div>
                        <UserFilters placeholder={t('searchPlaceholder')} />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>
                                        <SortableHeader column="name" label={t('name')} currentSort={sort} currentOrder={order} />
                                    </TableHead>
                                    <TableHead>
                                        <SortableHeader column="email" label={t('email')} currentSort={sort} currentOrder={order} />
                                    </TableHead>
                                    <TableHead>
                                        <SortableHeader column="role" label={t('role')} currentSort={sort} currentOrder={order} />
                                    </TableHead>
                                    <TableHead>
                                        <SortableHeader column="department" label={t('department')} currentSort={sort} currentOrder={order} />
                                    </TableHead>
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
                                                catalogSkills={catalogSkills}
                                                trigger={
                                                    <Button size="icon" variant="ghost">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                }
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {users.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24">
                                            No users found
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <PaginationControls
                        currentPage={page}
                        totalPages={totalPages}
                        baseUrl="/admin/users"
                        totalCount={totalCount}
                        limit={limit}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
