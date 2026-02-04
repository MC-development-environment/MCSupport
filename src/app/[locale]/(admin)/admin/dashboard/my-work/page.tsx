import { auth } from "@/core/auth";
import { prisma as db } from "@/infrastructure/db/prisma";
import { MyWorkBoard } from "@/components/admin/my-work-board";
// import { getTranslations } from "next-intl/server";

export default async function MyWorkPage() {
    const session = await auth();
    const user = session?.user;
    // const t = await getTranslations("Admin.Dashboard");

    if (!user) {
        return <div>Not authorized</div>;
    }

    // Fetch tickets assigned to current user, not closed
    const tickets = await db.case.findMany({
        where: {
            assignedToId: user.id,
            status: {
                not: "CLOSED",
            },
        },
        include: {
            user: true,
            _count: {
                select: { messages: true },
            },
        },
        orderBy: [
            // Order by SLA target ascending (soonest to expire first)
            { slaTargetAt: "asc" }, 
            { createdAt: "desc" },
        ],
    });

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center">
                <h1 className="text-lg font-semibold md:text-2xl">My work</h1>
            </div>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <MyWorkBoard tickets={tickets as any} />
        </div>
    );
}
