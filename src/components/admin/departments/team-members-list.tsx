"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { RoleBadge } from "@/components/role-badge";

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
}

interface TeamMembersListProps {
  users: User[];
}

const ITEMS_PER_PAGE = 10;

export function TeamMembersList({ users }: TeamMembersListProps) {
  const t = useTranslations("Admin.Departments.Metrics");
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(users.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentUsers = users.slice(startIndex, endIndex);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="rounded-full bg-gradient-to-br from-blue-500/20 to-blue-500/5 p-4 mb-3">
          <Users className="h-8 w-8 text-blue-500/50" />
        </div>
        <p className="text-muted-foreground text-sm">{t("noUsers")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Users List - Compact */}
      <div className="divide-y divide-border rounded-md border">
        {currentUsers.map((user, index) => (
          <div
            key={user.id}
            className="flex items-center justify-between px-3 py-2 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-5 text-right tabular-nums">
                {startIndex + index + 1}
              </span>
              <Avatar className="h-7 w-7">
                <AvatarImage src={user.image || ""} />
                <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-medium">
                  {user.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-medium">
                  {user.name || "Sin nombre"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {user.email}
                </span>
              </div>
            </div>
            <RoleBadge role={user.role} />
          </div>
        ))}
      </div>

      {/* Pagination - Always show */}
      <div className="flex items-center justify-between text-sm">
        <p className="text-muted-foreground">
          {t("showing")}{" "}
          <span className="font-medium text-foreground">
            {startIndex + 1}-{Math.min(endIndex, users.length)}
          </span>{" "}
          {t("of")}{" "}
          <span className="font-medium text-foreground">{users.length}</span>
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-2 text-muted-foreground">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
