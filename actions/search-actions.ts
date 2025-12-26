"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function searchGlobal(query: string) {
  const session = await auth();
  if (!session?.user) return { tickets: [], users: [], articles: [] };

  if (!query || query.length < 2)
    return { tickets: [], users: [], articles: [] };

  // Consultas paralelas
  const [tickets, users, articles] = await Promise.all([
    prisma.case.findMany({
      where: {
        OR: [
          { ticketNumber: { contains: query, mode: "insensitive" } },
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: { id: true, ticketNumber: true, title: true },
    }),
    prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: { id: true, name: true, email: true, role: true },
    }),
    prisma.article.findMany({
      where: {
        title: { contains: query, mode: "insensitive" },
      },
      take: 5,
      select: { id: true, title: true },
    }),
  ]);

  return { tickets, users, articles };
}
