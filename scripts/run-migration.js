const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 環境変数を読み込む
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('必要な環境変数が設定されていません');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    // SQLファイルを読み込む
    const sqlPath = path.join(__dirname, '../supabase/migrations/20250101_create_chat_tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('マイグレーションを実行中...');
    
    // SQLを実行
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });
    
    if (error) {
      // exec_sql RPCが存在しない場合は、手動実行が必要
      console.error('自動実行できませんでした:', error.message);
      console.log('\n以下の手順でマイグレーションを実行してください:');
      console.log('1. Supabaseダッシュボードにアクセス');
      console.log('2. SQL Editorを開く');
      console.log('3. 以下のSQLをコピー&ペーストして実行:');
      console.log('\n--- SQL開始 ---');
      console.log(sql);
      console.log('--- SQL終了 ---\n');
      return;
    }

    console.log('マイグレーションが正常に完了しました');
    
    // テーブルが作成されたか確認
    const tables = ['conversations', 'messages', 'conversation_participants'];
    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (!error) {
        console.log(`✅ ${table}テーブルが正常に作成されました`);
      } else {
        console.log(`❌ ${table}テーブルの確認でエラー:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
}

runMigration();