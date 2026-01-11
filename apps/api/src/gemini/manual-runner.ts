import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { runGeminiOnce } from './runner-core';

async function main() {
  const prisma = new PrismaClient();

  try {
    await runGeminiOnce({
      prisma,
      logger: console,
      parkingName: process.env.GEMINI_PARKING_NAME ?? '駐車場A',
      fallbackCarCount: process.env.FALLBACK_CAR_COUNT
        ? Number(process.env.FALLBACK_CAR_COUNT)
        : undefined,
    });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Gemini manual runner failed', error);
  process.exitCode = 1;
});
