import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction([
    prisma.parkingLot.deleteMany(),
    prisma.parkingLot.createMany({
      data: [
        { name: '駐車場A', capacity: 120, occupied: 0 },
        { name: '駐車場B', capacity: 80, occupied: 0 },
        { name: '駐車場C', capacity: 40, occupied: 0 },
      ],
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
