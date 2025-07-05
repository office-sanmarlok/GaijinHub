import { logger } from '@/lib/utils/logger';
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 環境変数を読み込む
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  logger.error('必要な環境変数が設定されていません');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    // SQLファイルを読み込む
    const sqlPath = path.join(__dirname, '../supabase/migrations/20250101_create_chat_tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    logger.debug('マイグレーションを実行中...');
    
    // SQLを実行
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });
    
    if (error) {
      // exec_sql RPCが存在しない場合は、手動実行が必要
      logger.error('自動実行できませんでした:', error.message);
      logger.debug('\n以下の手順でマイグレーションを実行してください:');
      logger.debug('1. Supabaseダッシュボードにアクセス');
      logger.debug('2. SQL Editorを開く');
      logger.debug('3. 以下のSQLをコピー&ペーストして実行:');
      logger.debug('\n--- SQL開始 ---');
      logger.debug(sql);
      logger.debug('--- SQL終了 ---\n');
      return;
    }

    logger.debug('マイグレーションが正常に完了しました');
    
    // テーブルが作成されたか確認
    const tables = ['conversations', 'messages', 'conversation_participants'];
    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (!error) {
        logger.debug(`✅ ${table}テーブルが正常に作成されました`);
      } else {
        logger.debug(`❌ ${table}テーブルの確認でエラー:`, error.message);
      }
    }
    
  } catch (error) {
    logger.error('エラーが発生しました:', error);
  }
}

runMigration();