import * as deepl from 'deepl-node';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '@/lib/utils/logger';

// .env.localファイルから環境変数を読み込む
dotenv.config({ path: '.env.local' });

const deeplApiKey = process.env.DEEPL_API_KEY!;

if (!deeplApiKey) {
  logger.error('DEEPL_API_KEY環境変数が設定されていません');
  process.exit(1);
}

const translator = new deepl.Translator(deeplApiKey);

// プレースホルダーを保護するための関数
function protectPlaceholders(text: string): { protected: string; placeholders: string[] } {
  const placeholders: string[] = [];
  let protected = text;
  
  // {variable}形式のプレースホルダーを検出して置換
  const placeholderRegex = /\{[^}]+\}/g;
  const matches = text.match(placeholderRegex);
  
  if (matches) {
    matches.forEach((match, index) => {
      placeholders.push(match);
      protected = protected.replace(match, `__PLACEHOLDER_${index}__`);
    });
  }
  
  return { protected, placeholders };
}

// プレースホルダーを復元する関数
function restorePlaceholders(text: string, placeholders: string[]): string {
  let restored = text;
  
  placeholders.forEach((placeholder, index) => {
    restored = restored.replace(`__PLACEHOLDER_${index}__`, placeholder);
  });
  
  return restored;
}

// JSONオブジェクトを再帰的に翻訳する関数
async function translateObject(obj: any, targetLang: deepl.TargetLanguageCode): Promise<any> {
  if (typeof obj === 'string') {
    try {
      // プレースホルダーを保護
      const { protected, placeholders } = protectPlaceholders(obj);
      
      // 翻訳
      const result = await translator.translateText(
        protected,
        'ja',
        targetLang
      );
      
      // プレースホルダーを復元
      return restorePlaceholders(result.text, placeholders);
    } catch (error) {
      logger.error(`翻訳エラー: "${obj}"`, error);
      return obj; // エラーの場合は元のテキストを返す
    }
  } else if (Array.isArray(obj)) {
    return Promise.all(obj.map(item => translateObject(item, targetLang)));
  } else if (typeof obj === 'object' && obj !== null) {
    const translatedObj: any = {};
    for (const [key, value] of Object.entries(obj)) {
      translatedObj[key] = await translateObject(value, targetLang);
    }
    return translatedObj;
  } else {
    return obj;
  }
}

async function translateMessages() {
  try {
    // 日本語のメッセージファイルを読み込む
    const jaPath = path.join(process.cwd(), 'messages', 'ja.json');
    const jaContent = await fs.readFile(jaPath, 'utf-8');
    const jaMessages = JSON.parse(jaContent);
    
    logger.debug('日本語メッセージファイルを読み込みました');
    logger.debug('インドネシア語への翻訳を開始します...');
    
    // インドネシア語に翻訳
    const idMessages = await translateObject(jaMessages, 'id' as deepl.TargetLanguageCode);
    
    // インドネシア語のメッセージファイルを保存
    const idPath = path.join(process.cwd(), 'messages', 'id.json');
    await fs.writeFile(idPath, JSON.stringify(idMessages, null, 2), 'utf-8');
    
    logger.debug('インドネシア語への翻訳が完了しました');
    logger.debug(`ファイルを保存しました: ${idPath}`);
    
  } catch (error) {
    logger.error('翻訳処理でエラーが発生しました:', error);
    process.exit(1);
  }
}

// メイン実行
translateMessages()
  .then(() => {
    logger.debug('翻訳処理が正常に完了しました');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('予期しないエラー:', error);
    process.exit(1);
  });