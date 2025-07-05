import * as fs from 'fs';
import * as path from 'path';

const messagesDir = path.join(process.cwd(), 'messages');
const localeFiles = fs.readdirSync(messagesDir).filter(file => file.endsWith('.json'));

for (const file of localeFiles) {
  const filePath = path.join(messagesDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  const messages = JSON.parse(content);
  
  // Add appName to common section if it doesn't exist
  if (!messages.common) {
    messages.common = {};
  }
  
  if (!messages.common.appName) {
    messages.common.appName = 'GaijinHub';
    
    // Write back to file with proper formatting
    fs.writeFileSync(filePath, JSON.stringify(messages, null, 2) + '\n');
    console.log(`Added appName to ${file}`);
  } else {
    console.log(`appName already exists in ${file}`);
  }
}

console.log('Done!');