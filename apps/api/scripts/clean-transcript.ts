// path: apps/api/scripts/clean-transcript.ts
import { prisma } from "../src/db";

async function main() {
  const email = process.argv[2];

  if (!email) {
    throw new Error("Thiếu email. Ví dụ: pnpm tsx scripts/clean-transcript.ts your@email.com");
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });

  if (!user) {
    throw new Error(`Không tìm thấy user với email: ${email}`);
  }

  const result = await prisma.$transaction(async (tx) => {
    const deletedComponents = await tx.transcriptComponent.deleteMany({
      where: { userId: user.id },
    });

    const deletedTranscripts = await tx.transcript.deleteMany({
      where: { userId: user.id },
    });

    return {
      deletedComponents: deletedComponents.count,
      deletedTranscripts: deletedTranscripts.count,
    };
  });

  console.log("Clean transcript done:", {
    email: user.email,
    ...result,
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });