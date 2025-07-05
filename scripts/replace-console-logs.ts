import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

async function replaceConsoleLogs() {
  const files = glob.sync('**/*.{ts,tsx,js,jsx}', {
    ignore: ['node_modules/**', '.next/**', 'scripts/replace-console-logs.ts', 'lib/utils/logger.ts']
  });

  let totalReplacements = 0;

  for (const file of files) {
    const filePath = path.resolve(file);
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;

    // Skip if file already imports logger
    const hasLoggerImport = content.includes("from '@/lib/utils/logger'");
    
    // Replace console.log with logger.debug
    content = content.replace(/console\.log\(/g, 'logger.debug(');
    
    // Replace console.error with logger.error
    content = content.replace(/console\.error\(/g, 'logger.error(');
    
    // Replace console.warn with logger.warn
    content = content.replace(/console\.warn\(/g, 'logger.warn(');
    
    // Replace console.info with logger.info
    content = content.replace(/console\.info\(/g, 'logger.info(');

    // If content changed and doesn't have logger import, add it
    if (content !== originalContent) {
      if (!hasLoggerImport && content.includes('logger.')) {
        // Find the right place to add import
        const importMatch = content.match(/^((['"])use (client|server)\2;?\s*\n)?/);
        const useDirective = importMatch ? importMatch[0] : '';
        const restContent = content.slice(useDirective.length);
        
        // Add import after 'use client'/'use server' if exists, otherwise at the beginning
        const importStatement = "import { logger } from '@/lib/utils/logger';\n";
        
        // Check if there are other imports
        const firstImportIndex = restContent.search(/^import\s/m);
        if (firstImportIndex !== -1) {
          // Add after the last import
          const lines = restContent.split('\n');
          let lastImportIndex = -1;
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim().startsWith('import ')) {
              lastImportIndex = i;
            }
          }
          lines.splice(lastImportIndex + 1, 0, importStatement.trim());
          content = useDirective + lines.join('\n');
        } else {
          content = useDirective + importStatement + restContent;
        }
      }
      
      fs.writeFileSync(filePath, content);
      totalReplacements++;
      console.log(`Updated: ${file}`);
    }
  }

  console.log(`\nTotal files updated: ${totalReplacements}`);
}

replaceConsoleLogs().catch(console.error);