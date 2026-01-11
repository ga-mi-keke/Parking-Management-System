import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { spawn } from 'child_process';
import * as path from 'path';

type Target = {
  parkingName: string;
  imagePaths: string[];
};

@Injectable()
export class PythonCounterService implements OnApplicationBootstrap {
  private readonly logger = new Logger(PythonCounterService.name);

  constructor(private readonly prisma: PrismaService) {}

  private readonly targets: Target[] = [
    {
      parkingName: '駐車場A',
      imagePaths: [
        // workspace root の /img
        path.resolve(process.cwd(), '..', '..', 'img', 'parkingimg.jpeg'),
        path.resolve(process.cwd(), 'img', 'parkingimg.jpeg'),
        path.resolve(process.cwd(), 'apps', 'api', 'src', 'images', 'parkingimg.jpeg'),
        path.resolve(__dirname, '..', '..', '..', '..', 'img', 'parkingimg.jpeg'),
      ],
    },
    {
      parkingName: '駐車場B',
      imagePaths: [
        path.resolve(process.cwd(), '..', '..', 'img', 'parkingimg2.jpg'),
        path.resolve(process.cwd(), 'img', 'parkingimg2.jpg'),
        path.resolve(process.cwd(), 'apps', 'api', 'src', 'images', 'parkingimg2.jpg'),
        path.resolve(__dirname, '..', '..', '..', '..', 'img', 'parkingimg2.jpg'),
      ],
    },
  ];

  private readonly pythonScriptPaths = [
    path.resolve(process.cwd(), '..', '..', 'python', 'car_counter_im.py'),
    path.resolve(process.cwd(), 'python', 'car_counter_im.py'),
    path.resolve(__dirname, '..', '..', '..', '..', 'python', 'car_counter_im.py'),
  ];
  private readonly pythonBin = process.env.PYTHON_BIN || 'python3';

  async onApplicationBootstrap(): Promise<void> {
    const enabled = (process.env.PYTHON_COUNTER_AUTO_RUN ?? 'true').toLowerCase() !== 'false';
    if (!enabled) {
      this.logger.log('Python counter auto-run disabled (PYTHON_COUNTER_AUTO_RUN=false)');
      return;
    }

    setTimeout(() => {
      this.runAll().catch((error) => {
        this.logger.error('Python counter auto-run failed', error as Error);
      });
    }, 0);

    this.logger.log('Python counter auto-run scheduled in background');
  }

  private findImage(paths: string[]): string | undefined {
    for (const p of paths) {
      try {
        if (require('fs').existsSync(p)) {
          this.logger.log(`画像パスを使用: ${p}`);
          return p;
        }
      } catch {
        // ignore
      }
    }
    return undefined;
  }

  private async runAll() {
    await Promise.all(this.targets.map((t) => this.processTarget(t)));
  }

  private async processTarget(target: Target): Promise<void> {
    const imagePath = this.findImage(target.imagePaths);
    if (!imagePath) {
      this.logger.warn(`画像が見つかりません: ${target.parkingName} -> ${target.imagePaths.join(', ')}`);
      return;
    }

    const pythonScript = this.findPythonScript();
    if (!pythonScript) {
      this.logger.error('python/car_counter_im.py が見つかりません。pythonScriptPaths を確認してください。');
      return;
    }

    const args = [pythonScript, '--image', imagePath, '--json'];

    this.logger.log(`Python実行: ${this.pythonBin} ${pythonScript} (${target.parkingName})`);

    const { carCount } = await this.execPython(args);
    await this.updateParking(target.parkingName, carCount);
  }

  private execPython(args: string[]): Promise<{ carCount: number }> {
    return new Promise((resolve, reject) => {
      const proc = spawn(this.pythonBin, args, { cwd: process.cwd() });
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code !== 0) {
          this.logger.error(`Python exit code ${code}: ${stderr.trim()}`);
          return reject(new Error(stderr || `Python exited with code ${code}`));
        }

        try {
          const lines = stdout.trim().split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
          let parsed: { car_count?: unknown } | null = null;
          for (let i = lines.length - 1; i >= 0; i -= 1) {
            const line = lines[i];
            if (line.startsWith('{') && line.endsWith('}')) {
              try {
                parsed = JSON.parse(line);
                break;
              } catch {
                // keep searching
              }
            }
          }
          if (!parsed) {
            parsed = JSON.parse(stdout.trim());
          }
          if (!parsed) {
            throw new Error(`Python output parse error: ${stdout.trim()}`);
          }
          const carCount = Number(parsed.car_count);
          if (Number.isNaN(carCount)) {
            throw new Error(`car_count is not a number: ${parsed.car_count}`);
          }
          resolve({ carCount });
        } catch (err) {
          this.logger.error(`Python output parse error: ${stdout.trim()}`);
          reject(err);
        }
      });
    });
  }

  private async updateParking(parkingName: string, carCount: number) {
    const parkingLot = await this.prisma.parkingLot.findUnique({
      where: { name: parkingName },
    });

    if (!parkingLot) {
      this.logger.warn(`駐車場 ${parkingName} がDBに存在しません。スキップします。`);
      return;
    }

    const normalized = Math.max(0, Math.round(carCount));
    const nextOccupied = Math.min(normalized, parkingLot.capacity);

    const updated = await this.prisma.parkingLot.update({
      where: { name: parkingName },
      data: { occupied: nextOccupied },
    });

    this.logger.log(
      `DB更新: ${updated.name} occupied ${parkingLot.occupied} -> ${updated.occupied} (capacity ${updated.capacity})`,
    );
  }

  private findPythonScript(): string | undefined {
    for (const p of this.pythonScriptPaths) {
      try {
        if (require('fs').existsSync(p)) {
          this.logger.log(`Pythonスクリプトを使用: ${p}`);
          return p;
        }
      } catch {
        // ignore
      }
    }
    return undefined;
  }
}
