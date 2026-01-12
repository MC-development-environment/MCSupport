"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { PriorityBadge } from "@/components/priority-badge";
import { CategoryBadge } from "@/components/category-badge";
import { SortableHeader } from "@/components/sortable-header";
import { PaginationControls } from "@/components/pagination-controls";
import { format } from "date-fns";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { Loader2, Users, CheckCircle, ChevronDown } from "lucide-react";
import { bulkAssign, bulkUpdateStatus } from "@/actions/bulk-actions";

// Types
import { User, Case } from "@prisma/client";

interface ExtendedTicket extends Case {
  user: User;
  assignedTo: User | null;
}

interface TicketsDataTableProps {
  tickets: ExtendedTicket[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  sort: string;
  order: string;
  users: Partial<User>[]; // Simplified list of assignable users
}

export function TicketsDataTable({
  tickets,
  totalCount,
  totalPages,
  currentPage,
  limit,
  sort,
  order,
  users,
}: TicketsDataTableProps) {
  const t = useTranslations("Admin");
  const locale = useLocale();
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  // Toggle all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(tickets.map((t) => t.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  // Toggle one
  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  const isAllSelected =
    tickets.length > 0 && selectedIds.size === tickets.length;
  const isIndeterminate =
    selectedIds.size > 0 && selectedIds.size < tickets.length;

  // Bulk Actions
  const handleBulkStatus = (status: string) => {
    startTransition(async () => {
      const ids = Array.from(selectedIds);
      const result = await bulkUpdateStatus(ids, status);
      if (result.success) {
        toast.success(t("bulkSuccess", { count: ids.length }));
        setSelectedIds(new Set());
        router.refresh();
      } else {
        toast.error(t("bulkError"));
      }
    });
  };

  const handleBulkAssign = (userId: string) => {
    startTransition(async () => {
      const ids = Array.from(selectedIds);
      const result = await bulkAssign(ids, userId);
      if (result.success) {
        toast.success(t("bulkSuccess", { count: ids.length }));
        setSelectedIds(new Set());
        router.refresh();
      } else {
        toast.error(t("bulkError"));
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Floating Action Bar */}
      {selectedIds.size > 0 && (
        <div className="sticky top-4 z-40 bg-accent text-accent-foreground p-3 rounded-lg shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2 border border-primary/20">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle className="h-4 w-4" />
            <span>
              {selectedIds.size} {t("selected")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Status Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm" disabled={isPending}>
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {t("TicketDetail.status")}{" "}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {t("TicketDetail.status")}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {[
                  "OPEN",
                  "IN_PROGRESS",
                  "WAITING_CUSTOMER",
                  "RESOLVED",
                  "CLOSED",
                ].map((status) => (
                  <DropdownMenuItem
                    key={status}
                    onClick={() => handleBulkStatus(status)}
                  >
                    <StatusBadge status={status} />
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Assign Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm" disabled={isPending}>
                  <Users className="mr-2 h-4 w-4" />
                  {t("TicketDetail.assignee")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="max-h-[300px] overflow-y-auto"
              >
                <DropdownMenuLabel>
                  {t("TicketDetail.assignee")}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {users.map((u) => (
                  <DropdownMenuItem
                    key={u.id}
                    onClick={() => u.id && handleBulkAssign(u.id)}
                  >
                    {u.name || u.email}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
            >
              X
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px] py-1">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                  // Indeterminate visual state is handled by Radix Checkbox usually via 'indeterminate' prop if supported or manual ref,
                  // but shadcn checkbox might strictly be bool.
                  // If strict bool, we just toggle.
                />
              </TableHead>
              <TableHead className="w-[100px] whitespace-nowrap py-1 text-xs">
                <SortableHeader
                  column="ticketNumber"
                  label={t("ticketNo")}
                  currentSort={sort}
                  currentOrder={order}
                />
              </TableHead>
              <TableHead className="max-w-[300px] py-1 text-xs">
                <SortableHeader
                  column="title"
                  label={t("ticketTitle")}
                  currentSort={sort}
                  currentOrder={order}
                />
              </TableHead>
              <TableHead className="max-w-[200px] py-1 text-xs">
                {t("customer")}
              </TableHead>
              <TableHead className="hidden sm:table-cell whitespace-nowrap py-1 text-xs">
                <SortableHeader
                  column="priority"
                  label={t("priority")}
                  currentSort={sort}
                  currentOrder={order}
                />
              </TableHead>
              <TableHead className="hidden sm:table-cell whitespace-nowrap py-1 text-xs">
                <SortableHeader
                  column="status"
                  label={t("status")}
                  currentSort={sort}
                  currentOrder={order}
                />
              </TableHead>
              <TableHead className="hidden lg:table-cell whitespace-nowrap py-1 text-xs">
                <SortableHeader
                  column="category"
                  label={t("category")}
                  currentSort={sort}
                  currentOrder={order}
                />
              </TableHead>
              <TableHead className="whitespace-nowrap py-1 text-xs">
                <SortableHeader
                  column="assignedTo"
                  label={t("TicketDetail.assignee")}
                  currentSort={sort}
                  currentOrder={order}
                />
              </TableHead>
              <TableHead className="hidden md:table-cell whitespace-nowrap text-right py-1 text-xs">
                <SortableHeader
                  column="createdAt"
                  label={t("date")}
                  currentSort={sort}
                  currentOrder={order}
                />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center h-24">
                  {t("noTickets")}
                </TableCell>
              </TableRow>
            ) : (
              tickets.map((ticket) => (
                <TableRow
                  key={ticket.id}
                  data-state={
                    selectedIds.has(ticket.id) ? "selected" : undefined
                  }
                >
                  <TableCell className="py-2">
                    <Checkbox
                      checked={selectedIds.has(ticket.id)}
                      onCheckedChange={(checked) =>
                        handleSelectOne(ticket.id, !!checked)
                      }
                      aria-label={`Select ticket ${ticket.ticketNumber}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium whitespace-nowrap py-2 text-xs">
                    <a
                      href={`/admin/tickets/${ticket.id}`}
                      className="hover:underline"
                    >
                      #
                      {ticket.ticketNumber ||
                        String(ticket.id).substring(0, 8).toUpperCase()}
                    </a>
                  </TableCell>
                  <TableCell className="max-w-[300px] py-2 text-xs">
                    <div className="font-medium truncate" title={ticket.title}>
                      <a
                        href={`/admin/tickets/${ticket.id}`}
                        className="hover:underline"
                      >
                        {ticket.title}
                      </a>
                    </div>
                    <div className="text-[10px] text-muted-foreground md:hidden mt-1">
                      <StatusBadge status={ticket.status} />
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px] py-2 text-xs">
                    <div className="space-y-1">
                      <div
                        className="font-medium truncate"
                        title={ticket.user.name || "Unknown"}
                      >
                        {ticket.user.name || "Unknown"}
                      </div>
                      <div
                        className="text-[10px] text-muted-foreground truncate"
                        title={ticket.user.email}
                      >
                        {ticket.user.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell py-2 text-xs">
                    <PriorityBadge priority={ticket.priority} />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell py-2 text-xs">
                    <StatusBadge status={ticket.status} />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell py-2 text-xs">
                    <CategoryBadge category={ticket.category} locale={locale} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap py-2 text-xs">
                    <div className="text-xs">
                      {ticket.assignedTo?.name || (
                        <span className="text-muted-foreground italic text-[10px]">
                          {t("TicketDetail.unassigned")}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-right whitespace-nowrap text-muted-foreground py-2 text-xs">
                    {format(new Date(ticket.createdAt), "yyyy-MM-dd")}
                    <span className="block text-[10px]">
                      {format(new Date(ticket.createdAt), "HH:mm")}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        baseUrl="/admin/tickets"
        totalCount={totalCount}
        limit={limit}
      />
    </div>
  );
}
