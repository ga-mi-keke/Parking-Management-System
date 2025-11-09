import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const defaultSpots = ['A-01', 'A-02', 'B-01', 'B-02'];

  await prisma.$transaction([
    prisma.parkingSpot.deleteMany(),
    prisma.parkingSpot.createMany({
      data: defaultSpots.map((label, index) => ({
        label,
        occupied: index === 1, // mark a single spot as occupied for demo
      })),
    }),
  ]);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
