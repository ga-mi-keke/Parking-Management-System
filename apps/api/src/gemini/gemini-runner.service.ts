import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { runGeminiOnce } from './runner-core';

@Injectable()
export class GeminiRunnerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(GeminiRunnerService.name);
  private readonly targetParkingName = process.env.GEMINI_PARKING_NAME ?? '駐車場A';
  private readonly fallbackCarCount = this.parseNumber(process.env.FALLBACK_CAR_COUNT);

  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap(): Promise<void> {
    const enabled = (process.env.GEMINI_AUTO_RUN ?? 'true').toLowerCase() !== 'false';
    if (!enabled) {
      this.logger.log('Gemini auto-run is disabled (GEMINI_AUTO_RUN=false)');
      return;
    }

    // バックグラウンドで実行し、API 起動をブロックしない
    setTimeout(() => {
      runGeminiOnce({
        prisma: this.prisma,
        logger: this.logger,
        parkingName: this.targetParkingName,
        fallbackCarCount: this.fallbackCarCount,
      }).catch((error) => {
        this.logger.error('Gemini auto-run failed', error as Error);
      });
    }, 0);

    this.logger.log('Gemini auto-run scheduled in background');
  }

  private parseNumber(value?: string): number | undefined {
    if (value === undefined) return undefined;
    const num = Number(value);
    return Number.isNaN(num) ? undefined : num;
  }
}
