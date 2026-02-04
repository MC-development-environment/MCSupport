import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "admin@multicomputos.com" },
  });

  if (!user) {
    console.log("User not found!");
  } else {
    console.log(`User found: ${user.email}`);
    console.log(`Role: ${user.role}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
