import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import { GoogleAIFileManager, FileState } from "@google/generative-ai/server";
import * as fs from "fs";
import * as path from "path";
import * as mime from "mime-types";

// === 設定 ===
const API_KEY = "yourAPIKeyHere";  // ここにAPIキーを記述
const MEDIA_DIR = "media";
const TARGET_FILE_NAME = "MAKINOTO.jpg"; // ここに解析したいファイル名を入力
const OUTPUT_FILE = "result.json"; // 出力するファイル名
// ============

const genAI = new GoogleGenerativeAI(API_KEY);
const fileManager = new GoogleAIFileManager(API_KEY);



// 画像の処理
function processImage(filePath: string, mimeType: string): Part {
    const fileBuffer = fs.readFileSync(filePath);
    return { inlineData: { data: fileBuffer.toString("base64"), mimeType } };
}

// 動画の処理
async function processVideo(filePath: string, mimeType: string): Promise<Part> {
    const fileName = path.basename(filePath);
    console.log("動画をアップロード中...");
    const uploadResult = await fileManager.uploadFile(filePath, { mimeType, displayName: fileName });
    let file = await fileManager.getFile(uploadResult.file.name);
    
    console.log("動画の処理待ち...");
    while (file.state === FileState.PROCESSING) {
        process.stdout.write("."); // 進行状況を表示
        await new Promise((resolve) => setTimeout(resolve, 2000));
        file = await fileManager.getFile(uploadResult.file.name);
    }
    console.log("\n動画処理完了。");
    return { fileData: { mimeType: file.mimeType, fileUri: uploadResult.file.uri } };
}

// メイン実行関数
async function main() {
    try {
        console.log("=== 解析スクリプト開始 ===");
        
        const filePath = path.join(__dirname, MEDIA_DIR, TARGET_FILE_NAME);
        if (!filePath) {
            console.error("エラー: メディアファイルが見つかりません。");
            return;
        }

        const fileName = path.basename(filePath);
        const mimeType = mime.lookup(filePath) as string;
        
        console.log(`解析対象: ${fileName} (${mimeType})`);

        let mediaPart: Part;
        if (mimeType.startsWith("image/")) {
            mediaPart = processImage(filePath, mimeType);
        } else {
            mediaPart = await processVideo(filePath, mimeType);
        }

        //AI生成
        console.log("AI解析を実行中...");
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        const prompt = `
            あなたは駐車場の監視システムです。
            画像(動画)を見て、以下のJSON形式で出力してください。
            {
                "status": "空車" または "混雑" または "満車",
                "occupancy_rate": 0〜100の数値,
                "car_count": 確認できる車の台数（概算）,
                "notes": "特記事項",
                "description": "20文字以内の短い状況説明"
            }
        `;

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }, mediaPart] }],
            generationConfig: { responseMimeType: "application/json" }
        });

        const analysisText = result.response.text();
        const analysis = JSON.parse(analysisText);

        //結果の整形と保存
        const outputData = {
            timestamp: new Date().toISOString(),
            target_file: fileName,
            mime_type: mimeType,
            result: analysis
        };

        // JSONファイルとして書き出し
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(outputData, null, 2), "utf-8");
        
        console.log("------------------------------------------------");
        console.log(`解析成功！結果を ${OUTPUT_FILE} に保存しました。`);
        console.log("内容プレビュー:", JSON.stringify(analysis, null, 2));

    } catch (error) {
        console.error("解析中にエラーが発生しました:", error);
    }
}

// 実行
main();