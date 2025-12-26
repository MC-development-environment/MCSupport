import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.article.count();
  console.log(`Total Articles: ${count}`);

  if (count > 0) {
    const articles = await prisma.article.findMany({
      select: {
        title: true,
        slug: true,
        isPublished: true,
        category: { select: { name: true } },
      },
    });
    console.table(articles);
  } else {
    console.log("No articles found in database.");
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
