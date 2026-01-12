"use client";

import * as React from "react";
import { User, Ticket, FileText, Search } from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { searchGlobal } from "@/actions/search-actions";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<{
    tickets: { id: string; ticketNumber: string; title: string }[];
    users: { id: string; name: string | null; email: string; role: string }[];
    articles: { id: string; title: string }[];
  }>({ tickets: [], users: [], articles: [] });

  const router = useRouter();
  const t = useTranslations("Admin");

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  React.useEffect(() => {
    if (query.length < 2) return;

    const timeoutId = setTimeout(async () => {
      const data = await searchGlobal(query);
      setResults(data);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  return (
    <>
      <Button
        variant="outline"
        className="relative h-8 w-full justify-start rounded-[0.5rem] bg-background text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-60 lg:w-64"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="hidden lg:inline-flex truncate">
          {t("GlobalSearch.placeholder")}
        </span>
        <span className="inline-flex lg:hidden truncate">
          {t("GlobalSearch.placeholder")}
        </span>
        <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder={t("GlobalSearch.placeholder")}
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>No se encontraron resultados.</CommandEmpty>

          {results.tickets.length > 0 && (
            <CommandGroup heading="Tickets">
              {results.tickets.map((t) => (
                <CommandItem
                  key={t.id}
                  value={`ticket-${t.id}-${t.title}`}
                  onSelect={() =>
                    runCommand(() => router.push(`/admin/tickets/${t.id}`))
                  }
                >
                  <Ticket className="mr-2 h-4 w-4" />
                  <span>
                    #{t.ticketNumber} - {t.title}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {results.articles.length > 0 && <CommandSeparator />}

          {results.articles.length > 0 && (
            <CommandGroup heading="Artículos">
              {results.articles.map((a) => (
                <CommandItem
                  key={a.id}
                  value={`article-${a.id}-${a.title}`}
                  onSelect={() =>
                    runCommand(() => router.push(`/admin/kb/${a.id}`))
                  }
                >
                  <FileText className="mr-2 h-4 w-4" />
                  <span>{a.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {results.users.length > 0 && <CommandSeparator />}

          {results.users.length > 0 && (
            <CommandGroup heading="Usuarios">
              {results.users.map((u) => (
                <CommandItem
                  key={u.id}
                  value={`user-${u.id}-${u.name}`}
                  onSelect={() => runCommand(() => router.push(`/admin/users`))}
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>
                    {u.name || u.email} ({u.role})
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
