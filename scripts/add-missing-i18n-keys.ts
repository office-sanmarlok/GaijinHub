import * as fs from 'fs';
import * as path from 'path';

const messagesDir = path.join(process.cwd(), 'messages');
const missingKeys = {
  listings: {
    gridView: 'Grid View',
    listView: 'List View'
  }
};

const translations: Record<string, typeof missingKeys> = {
  'en': missingKeys,
  'ja': {
    listings: {
      gridView: 'グリッド表示',
      listView: 'リスト表示'
    }
  },
  'zh-CN': {
    listings: {
      gridView: '网格视图',
      listView: '列表视图'
    }
  },
  'zh-TW': {
    listings: {
      gridView: '網格視圖',
      listView: '列表視圖'
    }
  },
  'ko': {
    listings: {
      gridView: '그리드 보기',
      listView: '목록 보기'
    }
  },
  'id': {
    listings: {
      gridView: 'Tampilan Grid',
      listView: 'Tampilan Daftar'
    }
  },
  'pt': {
    listings: {
      gridView: 'Visualização em Grade',
      listView: 'Visualização em Lista'
    }
  },
  'vi': {
    listings: {
      gridView: 'Xem dạng lưới',
      listView: 'Xem dạng danh sách'
    }
  }
};

const localeFiles = fs.readdirSync(messagesDir).filter(file => file.endsWith('.json'));

for (const file of localeFiles) {
  const locale = path.basename(file, '.json');
  const filePath = path.join(messagesDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  const messages = JSON.parse(content);
  
  // Add missing keys
  if (!messages.listings) {
    messages.listings = {};
  }
  
  const localeTranslations = translations[locale] || translations['en'];
  
  if (!messages.listings.gridView) {
    messages.listings.gridView = localeTranslations.listings.gridView;
  }
  
  if (!messages.listings.listView) {
    messages.listings.listView = localeTranslations.listings.listView;
  }
  
  // Write back to file with proper formatting
  fs.writeFileSync(filePath, JSON.stringify(messages, null, 2) + '\n');
  console.log(`Updated ${file}`);
}

console.log('Done adding missing i18n keys!');