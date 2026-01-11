import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as mime from 'mime-types';
import * as path from 'path';

type LoggerLike = Pick<Console, 'log' | 'warn' | 'error'>;

type RunOptions = {
  prisma: PrismaClient;
  logger?: LoggerLike;
  parkingName?: string;
  fallbackCarCount?: number;
  targetFilePaths?: string[];
  outputPath?: string;
  apiKey?: string;
};

const defaultPaths = [
  path.resolve(process.cwd(), 'src', 'images', 'parkingimg.jpeg'),
  path.resolve(process.cwd(), 'apps', 'api', 'src', 'images', 'parkingimg.jpeg'),
  path.resolve(__dirname, '..', 'images', 'parkingimg2.jpg'), // dist 配下を想定
];

function processImage(filePath: string, mimeType: string): Part {
  const fileBuffer = fs.readFileSync(filePath);
  return { inlineData: { data: fileBuffer.toString('base64'), mimeType } };
}

async function updateOccupied(
  prisma: PrismaClient,
  parkingName: string,
  carCount: number,
  logger: LoggerLike,
) {
  const parkingLot = await prisma.parkingLot.findUnique({
    where: { name: parkingName },
  });

  if (!parkingLot) {
    throw new Error(`駐車場 ${parkingName} がデータベースに存在しません。`);
  }

  const normalized = Math.max(0, Math.round(carCount));
  const nextOccupied = Math.min(normalized, parkingLot.capacity);

  const updated = await prisma.parkingLot.update({
    where: { name: parkingName },
    data: { occupied: nextOccupied },
  });

  logger.log(
    `DB更新: ${updated.name} occupied ${parkingLot.occupied} -> ${updated.occupied} (capacity ${updated.capacity})`,
  );

  return updated;
}

export async function runGeminiOnce({
  prisma,
  logger = console,
  parkingName = '駐車場A',
  fallbackCarCount,
  targetFilePaths = defaultPaths,
  outputPath = path.resolve(process.cwd(), 'result.json'),
  apiKey = process.env.GOOGLE_GENAI_API_KEY,
}: RunOptions): Promise<void> {
  logger.log(`process.cwd(): ${process.cwd()}`);

  const targetPath = targetFilePaths.find((p) => fs.existsSync(p));
  if (!targetPath) {
    logger.warn(`画像が見つかりません: ${targetFilePaths.join(', ')}`);
    return;
  }

  logger.log(`使用する画像パス: ${targetPath}`);

  const mimeType = mime.lookup(targetPath);
  if (!mimeType || typeof mimeType !== 'string' || !mimeType.startsWith('image/')) {
    logger.warn(`画像ファイルではありません -> ${path.basename(targetPath)}`);
    return;
  }

  let carCount: number;
  let analysis: Record<string, unknown> = {};

  if (!apiKey) {
    logger.warn(
      'GOOGLE_GENAI_API_KEY が設定されていません。FALLBACK_CAR_COUNT を使って更新します（解析スキップ）。',
    );
    if (fallbackCarCount === undefined) {
      logger.warn('FALLBACK_CAR_COUNT が設定されていないためスキップします。');
      return;
    }
    carCount = Math.max(0, Math.round(fallbackCarCount));
    analysis = {
      status: '不明',
      occupancy_rate: null,
      car_count: carCount,
      notes: 'APIキー未設定のため疑似値を使用',
      description: '手動入力',
    };
  } else {
    logger.log('AI解析を実行中...');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
      あなたは駐車場の監視システムです。
      画像を見て、以下のJSON形式で出力してください。
      {
          "status": "空車" または "混雑" または "満車",
          "occupancy_rate": 0〜100の数値,
          "car_count": 確認できる車の台数（概算）,
          "notes": "特記事項",
          "description": "20文字以内の短い状況説明"
      }
    `;

    const mediaPart = processImage(targetPath, mimeType);
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }, mediaPart] }],
      generationConfig: { responseMimeType: 'application/json' },
    });

    const analysisText = result.response.text();
    analysis = JSON.parse(analysisText);

    carCount = Number(analysis.car_count);
    if (Number.isNaN(carCount)) {
      throw new Error(`car_count を数値に変換できませんでした: ${analysis.car_count}`);
    }
  }

  const updated = await updateOccupied(prisma, parkingName, carCount, logger);

  const outputData = {
    timestamp: new Date().toISOString(),
    target_file: path.basename(targetPath),
    mime_type: mimeType,
    result: analysis,
    db_update: {
      parking_lot: updated.name,
      occupied: updated.occupied,
      capacity: updated.capacity,
    },
  };

  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf-8');

  logger.log(`Gemini解析完了。result.json を保存しました -> ${outputPath}`);
}
