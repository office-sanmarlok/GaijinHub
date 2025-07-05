import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

async function fixLoggerCalls() {
  const files = glob.sync('**/*.{ts,tsx,js,jsx}', {
    ignore: ['node_modules/**', '.next/**', 'scripts/fix-logger-calls.ts', 'app/lib/utils/logger.ts']
  });

  let totalFixed = 0;

  for (const file of files) {
    const filePath = path.resolve(file);
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;

    // Fix logger.debug, logger.info, logger.warn, logger.error with 3+ arguments
    // Pattern: logger.method('message', arg1, arg2, ...) -> logger.method('message', { arg1, arg2, ... })
    content = content.replace(
      /logger\.(debug|info|warn|error)\(([^,)]+),\s*([^)]+)\)/g,
      (match, method, message, args) => {
        // Count commas to see if there are multiple arguments
        const argCount = (args.match(/,/g) || []).length + 1;
        
        if (argCount === 1) {
          // Single argument, keep as is
          return `logger.${method}(${message}, ${args})`;
        } else {
          // Multiple arguments, need to convert to object
          // Split by comma but respect nested structures
          const argParts = [];
          let depth = 0;
          let currentArg = '';
          
          for (let i = 0; i < args.length; i++) {
            const char = args[i];
            if (char === '(' || char === '{' || char === '[') depth++;
            if (char === ')' || char === '}' || char === ']') depth--;
            
            if (char === ',' && depth === 0) {
              argParts.push(currentArg.trim());
              currentArg = '';
            } else {
              currentArg += char;
            }
          }
          if (currentArg.trim()) {
            argParts.push(currentArg.trim());
          }
          
          // Convert to object notation if it's not already an object
          if (argParts.length === 1 && argParts[0].startsWith('{')) {
            // Already an object
            return `logger.${method}(${message}, ${args})`;
          } else {
            // Convert to object
            const objectArgs = argParts.map((arg, index) => {
              // Try to extract variable name or create generic key
              const varMatch = arg.match(/^(\w+)\.?\w*$/);
              if (varMatch) {
                return `${varMatch[1]}: ${arg}`;
              } else if (arg.match(/^['"`]/)) {
                // String literal, use generic key
                return `arg${index + 1}: ${arg}`;
              } else {
                // Use the expression as key if simple enough
                const keyMatch = arg.match(/^(\w+)/);
                return keyMatch ? `${keyMatch[1]}: ${arg}` : `arg${index + 1}: ${arg}`;
              }
            }).join(', ');
            
            return `logger.${method}(${message}, { ${objectArgs} })`;
          }
        }
      }
    );

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      totalFixed++;
      console.log(`Fixed logger calls in: ${file}`);
    }
  }

  console.log(`\nTotal files fixed: ${totalFixed}`);
}

fixLoggerCalls().catch(console.error);