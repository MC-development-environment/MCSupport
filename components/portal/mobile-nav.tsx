"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Package2 } from "lucide-react";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="icon" variant="outline" className="sm:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="sm:max-w-xs">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <SheetDescription className="sr-only">
          Mobile navigation menu with links to home, tickets, and knowledge base
        </SheetDescription>
        <nav className="grid gap-6 text-lg font-medium">
          <Link
            href="#"
            className="group flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
            onClick={() => setOpen(false)}
          >
            <Package2 className="h-5 w-5 transition-all group-hover:scale-110" />
            <span className="sr-only">Multicomputos</span>
          </Link>
          <Link
            href="/portal"
            className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            onClick={() => setOpen(false)}
          >
            Home
          </Link>
          <Link
            href="/portal/tickets"
            className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            onClick={() => setOpen(false)}
          >
            My Tickets
          </Link>
          <Link
            href="/portal/kb"
            className="flex items-center gap-4 px-2.5 text-foreground"
            onClick={() => setOpen(false)}
          >
            Knowledge Base
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
